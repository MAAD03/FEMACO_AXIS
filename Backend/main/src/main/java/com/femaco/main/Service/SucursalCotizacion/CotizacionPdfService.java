package com.femaco.main.Service.SucursalCotizacion;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.femaco.main.Entity.Inventario.Articulo;
import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.SucursalCotizacion.Cotizacion;
import com.femaco.main.Entity.SucursalCotizacion.DetalleCotizacion;
import com.femaco.main.Entity.SucursalCotizacion.Sucursal;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.SucursalCotizacion.CotizacionRepository;
import com.femaco.main.Repository.SucursalCotizacion.DetalleCotizacionRepository;
import com.femaco.main.Repository.SucursalCotizacion.SucursalRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class CotizacionPdfService {

    private static final String RUTA_LOGO = "fel/logo-sucursal.png";

    private static final float ANCHO_CARTA = 612f;
    private static final float MARGEN = 36f;
    private static final float ALTO_MINIMO = 330f;
    private static final float ALTO_MAXIMO = 792f * 3;
    private static final float ALTURA_ENCABEZADO = 105f;
    private static final float ALTURA_ENCABEZADO_TABLA = 44f;
    private static final float ALTURA_FILA_BASE = 16f;
    private static final float ALTURA_POR_LINEA_EXTRA = 11f;
    private static final float ALTURA_TOTALES = 65f;
    private static final float ALTURA_AVISO = 25f;
    private static final float MARGEN_SUPERIOR_INFERIOR = MARGEN * 2;
    private static final float COLCHON_SEGURIDAD = 20f;
    private static final int CARACTERES_POR_LINEA_DESCRIPCION = 38;

    private static final Font FUENTE_TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
    private static final Font FUENTE_SUBTITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font FUENTE_NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 8);
    private static final Font FUENTE_NEGRITA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
    private static final Font FUENTE_TABLA_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6.5f);
    private static final Font FUENTE_TABLA_CELDA = FontFactory.getFont(FontFactory.HELVETICA, 6.5f);
    private static final Font FUENTE_SUCURSAL_NOMBRE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
    private static final Font FUENTE_SUCURSAL_DATOS = FontFactory.getFont(FontFactory.HELVETICA, 10);

    private final CotizacionRepository cotizacionRepository;
    private final DetalleCotizacionRepository detalleCotizacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;
    private final ArticuloRepository articuloRepository;

    public CotizacionPdfService(CotizacionRepository cotizacionRepository,
                                DetalleCotizacionRepository detalleCotizacionRepository,
                                UsuarioRepository usuarioRepository,
                                SucursalRepository sucursalRepository,
                                ArticuloRepository articuloRepository) {
        this.cotizacionRepository = cotizacionRepository;
        this.detalleCotizacionRepository = detalleCotizacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.sucursalRepository = sucursalRepository;
        this.articuloRepository = articuloRepository;
    }

    public byte[] generarPdf(Long idCotizacion) {
        Cotizacion cotizacion = cotizacionRepository.findById(idCotizacion)
                .orElseThrow(() -> new IllegalArgumentException("Cotización no encontrada: " + idCotizacion));

        Usuario usuario = usuarioRepository.findById(cotizacion.getIdUsuario())
                .orElseThrow(() -> new IllegalStateException(
                        "Usuario no encontrado para la cotización " + idCotizacion));
        Sucursal sucursal = sucursalRepository.findById(usuario.getIdSucursal())
                .orElseThrow(() -> new IllegalStateException("Sucursal no encontrada"));

        List<DetalleCotizacion> detalles = detalleCotizacionRepository.findByIdCotizacion(idCotizacion);
        if (detalles.isEmpty()) {
            throw new IllegalStateException(
                    "La cotización " + idCotizacion + " no tiene artículos en el detalle.");
        }

        Map<Long, Articulo> articulosPorId = new HashMap<>();
        List<String> descripciones = new ArrayList<>();
        for (DetalleCotizacion detalle : detalles) {
            Articulo articulo = articuloRepository.findById(detalle.getIdArticulo())
                    .orElseThrow(() -> new IllegalStateException(
                            "Artículo no encontrado: " + detalle.getIdArticulo()));
            articulosPorId.put(detalle.getIdArticulo(), articulo);
            descripciones.add(articulo.getNombre());
        }

        float altoPagina = estimarAltoPagina(descripciones);
        try {
            return construirPdf(cotizacion, usuario, sucursal, detalles, articulosPorId, altoPagina);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "No se pudo generar la cotización " + idCotizacion, e);
        }
    }

    private byte[] construirPdf(Cotizacion cotizacion, Usuario usuario, Sucursal sucursal,
                                List<DetalleCotizacion> detalles, Map<Long, Articulo> articulosPorId,
                                float altoPagina) throws Exception {
        Document document = new Document(new Rectangle(ANCHO_CARTA, altoPagina));
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        document.setMargins(MARGEN, MARGEN, MARGEN, MARGEN);
        document.open();

        agregarEncabezado(document, cotizacion, usuario, sucursal);
        agregarTablaItems(document, detalles, articulosPorId);
        agregarTotales(document, cotizacion);
        document.add(parrafoCompacto("Esta cotización tiene una validez de 2 días.", FUENTE_NORMAL,
                Element.ALIGN_CENTER));

        document.close();
        return baos.toByteArray();
    }

    private float estimarAltoPagina(List<String> descripciones) {
        float alto = ALTURA_ENCABEZADO + ALTURA_ENCABEZADO_TABLA + ALTURA_TOTALES
                + ALTURA_AVISO + MARGEN_SUPERIOR_INFERIOR + COLCHON_SEGURIDAD;

        for (String descripcion : descripciones) {
            int lineas = Math.max(1, (int) Math.ceil(descripcion.length()
                    / (double) CARACTERES_POR_LINEA_DESCRIPCION));
            alto += ALTURA_FILA_BASE + (lineas - 1) * ALTURA_POR_LINEA_EXTRA;
        }

        return Math.min(Math.max(ALTO_MINIMO, alto), ALTO_MAXIMO);
    }

    private Paragraph parrafoCompacto(String texto, Font fuente) {
        Paragraph parrafo = new Paragraph(texto, fuente);
        parrafo.setLeading(fuente.getSize() * 1.15f);
        parrafo.setSpacingAfter(1f);
        return parrafo;
    }

    private Paragraph parrafoCompacto(String texto, Font fuente, int alineacion) {
        Paragraph parrafo = parrafoCompacto(texto, fuente);
        parrafo.setAlignment(alineacion);
        return parrafo;
    }

    private void agregarEspacio(Document document, float alto) throws Exception {
        Paragraph espacio = new Paragraph(" ");
        espacio.setLeading(alto);
        document.add(espacio);
    }

    private void agregarEncabezado(Document document, Cotizacion cotizacion,
                                   Usuario usuario, Sucursal sucursal) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{65f, 35f});

        PdfPCell celdaIzquierda = new PdfPCell();
        celdaIzquierda.setBorder(Rectangle.NO_BORDER);
        celdaIzquierda.addElement(parrafoCompacto("DOCUMENTO DE COTIZACIÓN", FUENTE_TITULO));
        celdaIzquierda.addElement(parrafoCompacto(
                "Id. cotización: " + cotizacion.getIdCotizacion(), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(
                "Fecha: " + formatearFecha(cotizacion.getFecha()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(
                "Usuario: " + nombreUsuario(usuario), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(" ", FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto("Cliente", FUENTE_SUBTITULO));
        celdaIzquierda.addElement(parrafoCompacto(
                "NIT: " + valorOTexto(cotizacion.getNit())
                        + "   Nombre: " + valorOTexto(cotizacion.getNombre()), FUENTE_NORMAL));
        tabla.addCell(celdaIzquierda);

        PdfPCell celdaDerecha = new PdfPCell();
        celdaDerecha.setBorder(Rectangle.NO_BORDER);
        celdaDerecha.setHorizontalAlignment(Element.ALIGN_RIGHT);

        Image logo = cargarLogo();
        if (logo != null) {
            logo.scaleToFit(130f, 65f);
            celdaDerecha.addElement(logo);
        }
        celdaDerecha.addElement(parrafoCompacto(
                valorOTexto(sucursal.getNombre()), FUENTE_SUCURSAL_NOMBRE, Element.ALIGN_RIGHT));
        celdaDerecha.addElement(parrafoCompacto(
                valorOTexto(sucursal.getDireccion()), FUENTE_SUCURSAL_DATOS, Element.ALIGN_RIGHT));
        celdaDerecha.addElement(parrafoCompacto(
                "Tel: " + valorOTexto(sucursal.getTelefono()), FUENTE_SUCURSAL_DATOS, Element.ALIGN_RIGHT));
        tabla.addCell(celdaDerecha);

        document.add(tabla);
        agregarEspacio(document, 4f);
    }

    private String nombreUsuario(Usuario usuario) {
        return valorOTexto(usuario.getNombre()) + " " + valorOTexto(usuario.getApellido());
    }

    private Image cargarLogo() {
        try {
            ClassPathResource recurso = new ClassPathResource(RUTA_LOGO);
            if (!recurso.exists()) {
                return null;
            }
            try (InputStream inputStream = recurso.getInputStream()) {
                return Image.getInstance(inputStream.readAllBytes());
            }
        } catch (Exception e) {
            return null;
        }
    }

    private void agregarTablaItems(Document document, List<DetalleCotizacion> detalles,
                                   Map<Long, Articulo> articulosPorId) throws Exception {
        PdfPTable tabla = new PdfPTable(10);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{7f, 21f, 8f, 11f, 11f, 10f, 9f, 10f, 9f, 12f});

        agregarCeldaHeader(tabla, "ID\nartículo");
        agregarCeldaHeader(tabla, "Artículo");
        agregarCeldaHeader(tabla, "Cantidad");
        agregarCeldaHeader(tabla, "Precio\nunitario");
        agregarCeldaHeader(tabla, "Subtotal\nbruto");
        agregarCeldaHeader(tabla, "Porc. desc.\nmayorista");
        agregarCeldaHeader(tabla, "Desc.\nmayorista");
        agregarCeldaHeader(tabla, "Porc. desc.\nmanual");
        agregarCeldaHeader(tabla, "Desc.\nmanual");
        agregarCeldaHeader(tabla, "Subtotal");

        for (DetalleCotizacion detalle : detalles) {
            Articulo articulo = articulosPorId.get(detalle.getIdArticulo());
                agregarCeldaTexto(tabla, String.valueOf(detalle.getIdArticulo()));
                agregarCeldaTexto(tabla, articulo.getNombre());
                agregarCeldaTexto(tabla, valorDecimal(detalle.getCantidad()).toPlainString());
                agregarCeldaTexto(tabla, dinero(detalle.getPrecioUnitario()));
                agregarCeldaTexto(tabla, dinero(detalle.getSubtotalBruto()));
                agregarCeldaTexto(tabla, porcentaje(detalle.getPorcDescuentoMayorista()));
                agregarCeldaTexto(tabla, dinero(detalle.getMontoDescuentoMayorista()));
                agregarCeldaTexto(tabla, porcentaje(detalle.getPorcDescuentoManual()));
                agregarCeldaTexto(tabla, dinero(detalle.getMontoDescuentoManual()));
                agregarCeldaTexto(tabla, dinero(detalle.getSubtotal()));
        }

        document.add(tabla);
        agregarEspacio(document, 4f);
    }

    private void agregarCeldaHeader(PdfPTable tabla, String texto) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, FUENTE_TABLA_HEADER));
        celda.setHorizontalAlignment(Element.ALIGN_CENTER);
        celda.setPadding(2f);
        celda.setBorderColor(Color.WHITE);
        tabla.addCell(celda);
    }

    private void agregarCeldaTexto(PdfPTable tabla, String texto) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, FUENTE_TABLA_CELDA));
        celda.setHorizontalAlignment(Element.ALIGN_CENTER);
        celda.setVerticalAlignment(Element.ALIGN_MIDDLE);
        celda.setPadding(2f);
        celda.setBorderColor(Color.WHITE);
        tabla.addCell(celda);
    }

    private void agregarTotales(Document document, Cotizacion cotizacion) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(45f);
        tabla.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.setWidths(new float[]{60f, 40f});

        agregarFilaTotal(tabla, "Subtotal bruto:", cotizacion.getSubtotal(), false);
        agregarFilaTotal(tabla, "Descuento total:", valorDecimal(cotizacion.getDescuentoTotal()).negate(), false);
        agregarFilaTotal(tabla, "TOTAL:", cotizacion.getTotal(), true);

        document.add(tabla);
    }

    private void agregarFilaTotal(PdfPTable tabla, String etiqueta, BigDecimal valor, boolean destacado) {
        Font fuente = destacado ? FUENTE_NEGRITA : FUENTE_NORMAL;

        PdfPCell celdaEtiqueta = new PdfPCell(new Phrase(etiqueta, fuente));
        celdaEtiqueta.setBorder(Rectangle.NO_BORDER);
        celdaEtiqueta.setPadding(2f);
        celdaEtiqueta.setHorizontalAlignment(Element.ALIGN_LEFT);
        tabla.addCell(celdaEtiqueta);

        PdfPCell celdaValor = new PdfPCell(new Phrase(dinero(valor), fuente));
        celdaValor.setBorder(Rectangle.NO_BORDER);
        celdaValor.setPadding(2f);
        celdaValor.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.addCell(celdaValor);
    }

    private BigDecimal valorDecimal(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    private String dinero(BigDecimal valor) {
        return valorDecimal(valor).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String porcentaje(BigDecimal valor) {
        return dinero(valor) + "%";
    }

    private String valorOTexto(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor;
    }

    private String formatearFecha(LocalDateTime fecha) {
        if (fecha == null) {
            return "-";
        }
        return fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
    }
}