package com.femaco.main.Service.Ventas;

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
import com.femaco.main.Entity.SucursalCotizacion.Sucursal;
import com.femaco.main.Entity.Ventas.Cliente;
import com.femaco.main.Entity.Ventas.Venta;
import com.femaco.main.Entity.Ventas.VentaDetalle;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.SucursalCotizacion.SucursalRepository;
import com.femaco.main.Repository.Ventas.ClienteRepository;
import com.femaco.main.Repository.Ventas.VentaDetalleRepository;
import com.femaco.main.Repository.Ventas.VentaRepository;
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
public class ComprobanteVentaPdfService {

    private static final String RUTA_LOGO = "fel/logo-sucursal.png";

    private static final float ANCHO_CARTA = 612f;
    private static final float MARGEN = 36f;
    private static final float ALTO_MINIMO = 330f;
    private static final float ALTO_MAXIMO = 792f * 3;
    private static final float ALTURA_ENCABEZADO = 92f;
    private static final float ALTURA_ENCABEZADO_TABLA = 20f;
    private static final float ALTURA_FILA_BASE = 16f;
    private static final float ALTURA_POR_LINEA_EXTRA = 11f;
    private static final float ALTURA_TOTALES = 65f;
    private static final float MARGEN_SUPERIOR_INFERIOR = MARGEN * 2;
    private static final float COLCHON_SEGURIDAD = 20f;
    private static final int CARACTERES_POR_LINEA_DESCRIPCION = 38;

    private static final Font FUENTE_TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
    private static final Font FUENTE_SUBTITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font FUENTE_NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 8);
    private static final Font FUENTE_NEGRITA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
    private static final Font FUENTE_TABLA_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
    private static final Font FUENTE_TABLA_CELDA = FontFactory.getFont(FontFactory.HELVETICA, 8);
    private static final Font FUENTE_SUCURSAL_NOMBRE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
    private static final Font FUENTE_SUCURSAL_DATOS = FontFactory.getFont(FontFactory.HELVETICA, 10);

    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;
    private final ArticuloRepository articuloRepository;

    public ComprobanteVentaPdfService(VentaRepository ventaRepository,
                                      VentaDetalleRepository ventaDetalleRepository,
                                      ClienteRepository clienteRepository,
                                      UsuarioRepository usuarioRepository,
                                      SucursalRepository sucursalRepository,
                                      ArticuloRepository articuloRepository) {
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.sucursalRepository = sucursalRepository;
        this.articuloRepository = articuloRepository;
    }

    public byte[] generarPdf(Long idVenta) {
        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada: " + idVenta));

        Cliente cliente = clienteRepository.findById(venta.getIdCliente())
                .orElseThrow(() -> new IllegalStateException("Cliente no encontrado para la venta " + idVenta));

        Usuario usuario = usuarioRepository.findById(venta.getIdUsuario())
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado para la venta " + idVenta));

        Sucursal sucursal = sucursalRepository.findById(usuario.getIdSucursal())
                .orElseThrow(() -> new IllegalStateException("Sucursal no encontrada"));

        List<VentaDetalle> detalles = ventaDetalleRepository.findByIdVenta(idVenta);
        if (detalles.isEmpty()) {
            throw new IllegalStateException("La venta " + idVenta + " no tiene artículos en el detalle.");
        }

        Map<Long, Articulo> articulosPorId = new HashMap<>();
        List<String> descripciones = new ArrayList<>();
        for (VentaDetalle detalle : detalles) {
            Articulo articulo = articuloRepository.findById(detalle.getIdArticulo())
                    .orElseThrow(() -> new IllegalStateException(
                            "Artículo no encontrado: " + detalle.getIdArticulo()));
            articulosPorId.put(detalle.getIdArticulo(), articulo);
            descripciones.add(articulo.getNombre());
        }

        float altoPagina = estimarAltoPagina(descripciones);
        try {
            return construirPdf(venta, cliente, sucursal, detalles, articulosPorId, altoPagina);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el comprobante de la venta " + idVenta, e);
        }
    }

    private byte[] construirPdf(Venta venta, Cliente cliente, Sucursal sucursal,
                                List<VentaDetalle> detalles, Map<Long, Articulo> articulosPorId,
                                float altoPagina) throws Exception {
        Document document = new Document(new Rectangle(ANCHO_CARTA, altoPagina));
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        document.setMargins(MARGEN, MARGEN, MARGEN, MARGEN);
        document.open();

        agregarEncabezado(document, venta, cliente, sucursal);
        agregarTablaItems(document, detalles, articulosPorId);
        agregarTotales(document, venta);

        document.close();
        return baos.toByteArray();
    }

    private float estimarAltoPagina(List<String> descripciones) {
        float alto = ALTURA_ENCABEZADO + ALTURA_ENCABEZADO_TABLA + ALTURA_TOTALES
                + MARGEN_SUPERIOR_INFERIOR + COLCHON_SEGURIDAD;

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

    private void agregarEncabezado(Document document, Venta venta, Cliente cliente,
                                   Sucursal sucursal) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{65f, 35f});

        PdfPCell celdaIzquierda = new PdfPCell();
        celdaIzquierda.setBorder(Rectangle.NO_BORDER);
        celdaIzquierda.addElement(parrafoCompacto("COMPROBANTE DE VENTA", FUENTE_TITULO));
        celdaIzquierda.addElement(parrafoCompacto(
                "No. comprobante: " + valorOTexto(venta.getNumeroFactura()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(
                "Fecha: " + formatearFecha(venta.getFecha()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(" ", FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto("Cliente", FUENTE_SUBTITULO));
        celdaIzquierda.addElement(parrafoCompacto(
                "NIT: " + valorOTexto(cliente.getNit())
                        + "   Nombre: " + valorOTexto(cliente.getNombre()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(
                "Dirección: " + valorOTexto(cliente.getDireccion()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(
                "Correo: " + valorOTexto(cliente.getCorreo()), FUENTE_NORMAL));
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

    private void agregarTablaItems(Document document, List<VentaDetalle> detalles,
                                   Map<Long, Articulo> articulosPorId) throws Exception {
        PdfPTable tabla = new PdfPTable(5);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{40f, 12f, 16f, 14f, 18f});

        agregarCeldaHeader(tabla, "Descripción");
        agregarCeldaHeader(tabla, "Cantidad");
        agregarCeldaHeader(tabla, "P. Unitario");
        agregarCeldaHeader(tabla, "Descuento");
        agregarCeldaHeader(tabla, "Total");

        for (VentaDetalle detalle : detalles) {
            Articulo articulo = articulosPorId.get(detalle.getIdArticulo());
            BigDecimal descuento = valorDecimal(detalle.getMontoDescuentoMayorista())
                    .add(valorDecimal(detalle.getMontoDescuentoManual()));

            agregarCeldaTexto(tabla, articulo.getNombre(), Element.ALIGN_LEFT);
            agregarCeldaTexto(tabla, valorDecimal(detalle.getCantidad()).toPlainString(), Element.ALIGN_RIGHT);
            agregarCeldaTexto(tabla, dinero(detalle.getPrecioUnitario()), Element.ALIGN_RIGHT);
            agregarCeldaTexto(tabla, dinero(descuento), Element.ALIGN_RIGHT);
            agregarCeldaTexto(tabla, dinero(detalle.getSubtotal()), Element.ALIGN_RIGHT);
        }

        document.add(tabla);
        agregarEspacio(document, 4f);
    }

    private void agregarCeldaHeader(PdfPTable tabla, String texto) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, FUENTE_TABLA_HEADER));
        celda.setHorizontalAlignment(Element.ALIGN_CENTER);
        celda.setPadding(4f);
        celda.setBorderColor(Color.WHITE);
        tabla.addCell(celda);
    }

    private void agregarCeldaTexto(PdfPTable tabla, String texto, int alineacion) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, FUENTE_TABLA_CELDA));
        celda.setHorizontalAlignment(alineacion);
        celda.setPadding(4f);
        celda.setBorderColor(Color.WHITE);
        tabla.addCell(celda);
    }

    private void agregarTotales(Document document, Venta venta) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(45f);
        tabla.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.setWidths(new float[]{60f, 40f});

        agregarFilaTotal(tabla, "Subtotal bruto:", venta.getSubtotal(), false);
        agregarFilaTotal(tabla, "Descuento total:", valorDecimal(venta.getDescuentoTotal()).negate(), false);
        agregarFilaTotal(tabla, "TOTAL:", venta.getTotal(), true);

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
