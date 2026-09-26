package com.femaco.main.FEL;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
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
import com.femaco.main.Entity.Ventas.VentaFel;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.SucursalCotizacion.SucursalRepository;
import com.femaco.main.Repository.Ventas.ClienteRepository;
import com.femaco.main.Repository.Ventas.VentaDetalleRepository;
import com.femaco.main.Repository.Ventas.VentaFelRepository;
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
public class FelPdfGeneratorService {

    private static final String RUTA_LOGO = "fel/logo-sucursal.png";

    private static final float ANCHO_CARTA = 612f;
    private static final float MARGEN = 36f;
    private static final float ALTO_MINIMO = 400f;
    private static final float ALTO_MAXIMO = 792f * 3;

    private static final float ALTURA_ENCABEZADO = 105f;
    private static final float ALTURA_FRASE = 14f;
    private static final float ALTURA_ENCABEZADO_TABLA = 20f;
    private static final float ALTURA_FILA_BASE = 16f;
    private static final float ALTURA_POR_LINEA_EXTRA = 11f;
    private static final float ALTURA_TOTALES = 75f;
    private static final float ALTURA_CERTIFICACION = 115f;
    private static final float ALTURA_ANULACION = 80f;
    private static final float MARGEN_SUPERIOR_INFERIOR = MARGEN * 2;
    private static final float COLCHON_SEGURIDAD = 30f;
    private static final int CARACTERES_POR_LINEA_DESCRIPCION = 38;

    private static final Font FUENTE_TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
    private static final Font FUENTE_SUBTITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font FUENTE_NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 8);
    private static final Font FUENTE_NEGRITA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
    private static final Font FUENTE_TABLA_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
    private static final Font FUENTE_TABLA_CELDA = FontFactory.getFont(FontFactory.HELVETICA, 8);
    private static final Font FUENTE_ANULADO = FontFactory.getFont(FontFactory.HELVETICA, 11, Font.BOLD, Color.RED);
    private static final Font FUENTE_SUCURSAL_NOMBRE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
    private static final Font FUENTE_SUCURSAL_DATOS = FontFactory.getFont(FontFactory.HELVETICA, 10);

    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;
    private final ArticuloRepository articuloRepository;
    private final VentaFelRepository ventaFelRepository;

    public FelPdfGeneratorService(VentaRepository ventaRepository,
                                   VentaDetalleRepository ventaDetalleRepository,
                                   ClienteRepository clienteRepository,
                                   UsuarioRepository usuarioRepository,
                                   SucursalRepository sucursalRepository,
                                   ArticuloRepository articuloRepository,
                                   VentaFelRepository ventaFelRepository) {
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.sucursalRepository = sucursalRepository;
        this.articuloRepository = articuloRepository;
        this.ventaFelRepository = ventaFelRepository;
    }

    public byte[] generarPdf(Long idVenta) {
        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada: " + idVenta));

        VentaFel ventaFel = ventaFelRepository.findByIdVenta(idVenta)
                .orElseThrow(() -> new IllegalStateException("La venta " + idVenta + " no tiene una certificación FEL."));

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

        boolean anulado = "ANULADO".equalsIgnoreCase(ventaFel.getEstadoDocumento());

        try {
            return construirPdf(venta, cliente, sucursal, detalles, ventaFel, anulado);
        } catch (FelPdfGenerationException e) {
            throw e;
        } catch (Exception e) {
            throw new FelPdfGenerationException("No se pudo generar el PDF de la venta " + idVenta + ": " + e.getMessage(), e);
        }
    }

    private byte[] construirPdf(Venta venta, Cliente cliente, Sucursal sucursal,
                                 List<VentaDetalle> detalles, VentaFel ventaFel, boolean anulado) throws Exception {

        Map<Long, Articulo> articulosPorId = new HashMap<>();
        List<String> descripciones = new ArrayList<>();
        for (VentaDetalle d : detalles) {
            Articulo articulo = articuloRepository.findById(d.getIdArticulo())
                    .orElseThrow(() -> new IllegalStateException("Artículo no encontrado: " + d.getIdArticulo()));
            articulosPorId.put(d.getIdArticulo(), articulo);
            descripciones.add(articulo.getNombre());
        }

        boolean tieneFrase = sucursal.getFelTipoFrase() != null && !sucursal.getFelTipoFrase().isBlank();
        float altoPagina = estimarAltoPagina(tieneFrase, anulado, descripciones);

        Document document = new Document(new Rectangle(ANCHO_CARTA, altoPagina));
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        document.setMargins(MARGEN, MARGEN, MARGEN, MARGEN);
        document.open();

        agregarEncabezado(document, venta, cliente, sucursal, ventaFel);
        if (tieneFrase) {
            agregarFrase(document, sucursal);
        }
        agregarTablaItems(document, detalles, articulosPorId);
        agregarTotales(document, venta, ventaFel);
        agregarCertificacion(document, ventaFel);
        if (anulado) {
            agregarAnulacion(document, ventaFel);
        }

        document.close();
        return baos.toByteArray();
    }

    private float estimarAltoPagina(boolean tieneFrase, boolean anulado, List<String> descripciones) {
        float alto = ALTURA_ENCABEZADO + ALTURA_ENCABEZADO_TABLA + ALTURA_TOTALES
                + ALTURA_CERTIFICACION + MARGEN_SUPERIOR_INFERIOR + COLCHON_SEGURIDAD;
        if (tieneFrase) alto += ALTURA_FRASE;
        if (anulado) alto += ALTURA_ANULACION;

        for (String descripcion : descripciones) {
            int lineas = Math.max(1, (int) Math.ceil(descripcion.length() / (double) CARACTERES_POR_LINEA_DESCRIPCION));
            alto += ALTURA_FILA_BASE + (lineas - 1) * ALTURA_POR_LINEA_EXTRA;
        }

        float resultado = Math.max(ALTO_MINIMO, alto);
        return Math.min(resultado, ALTO_MAXIMO);
    }

    private Paragraph parrafoCompacto(String texto, Font fuente) {
        Paragraph p = new Paragraph(texto, fuente);
        p.setLeading(fuente.getSize() * 1.15f);
        p.setSpacingAfter(1f);
        return p;
    }

    private Paragraph parrafoCompacto(String texto, Font fuente, int alineacion) {
        Paragraph p = parrafoCompacto(texto, fuente);
        p.setAlignment(alineacion);
        return p;
    }

    private void agregarEspacio(Document document, float alto) throws Exception {
        Paragraph espacio = new Paragraph(" ");
        espacio.setLeading(alto);
        document.add(espacio);
    }

    private void agregarEncabezado(Document document, Venta venta, Cliente cliente,
                                    Sucursal sucursal, VentaFel ventaFel) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{65f, 35f});

        PdfPCell celdaIzquierda = new PdfPCell();
        celdaIzquierda.setBorder(Rectangle.NO_BORDER);

        celdaIzquierda.addElement(parrafoCompacto("DOCUMENTO TRIBUTARIO ELECTRÓNICO", FUENTE_TITULO));
        celdaIzquierda.addElement(parrafoCompacto("FACTURA", FUENTE_SUBTITULO));
        celdaIzquierda.addElement(parrafoCompacto(" ", FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(
                "Serie: " + valorOTexto(ventaFel.getSerieDocumento())
                + "   Número: " + valorOTexto(ventaFel.getNumeroDocumento()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(
            "Fecha emisión: " + formatearFecha(ventaFel.getFechaHoraEmision()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(
            "No. Factura interno: " + valorOTexto(venta.getNumeroFactura()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto(" ", FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto("Cliente", FUENTE_SUBTITULO));
        celdaIzquierda.addElement(parrafoCompacto(
            "NIT: " + valorOTexto(cliente.getNit()) + "   Nombre: " + valorOTexto(cliente.getNombre()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto("Dirección: " + valorOTexto(cliente.getDireccion()), FUENTE_NORMAL));
        celdaIzquierda.addElement(parrafoCompacto("Correo: " + valorOTexto(cliente.getCorreo()), FUENTE_NORMAL));

        tabla.addCell(celdaIzquierda);

        PdfPCell celdaDerecha = new PdfPCell();
        celdaDerecha.setBorder(Rectangle.NO_BORDER);
        celdaDerecha.setHorizontalAlignment(Element.ALIGN_RIGHT);

        Image logo = cargarLogo();
        if (logo != null) {
            logo.scaleToFit(130f, 65f);
            celdaDerecha.addElement(logo);
        }

        celdaDerecha.addElement(parrafoCompacto(valorOTexto(sucursal.getNombre()), FUENTE_SUCURSAL_NOMBRE, Element.ALIGN_RIGHT));
        celdaDerecha.addElement(parrafoCompacto(valorOTexto(sucursal.getDireccion()), FUENTE_SUCURSAL_DATOS, Element.ALIGN_RIGHT));
        celdaDerecha.addElement(parrafoCompacto("Tel: " + valorOTexto(sucursal.getTelefono()), FUENTE_SUCURSAL_DATOS, Element.ALIGN_RIGHT));

        tabla.addCell(celdaDerecha);

        document.add(tabla);
        agregarEspacio(document, 6f);
    }

    private Image cargarLogo() {
        try {
            ClassPathResource recurso = new ClassPathResource(RUTA_LOGO);
            if (!recurso.exists()) {
                return null;
            }
            try (InputStream is = recurso.getInputStream()) {
                byte[] bytes = is.readAllBytes();
                return Image.getInstance(bytes);
            }
        } catch (Exception e) {
            return null;
        }
    }

    private void agregarFrase(Document document, Sucursal sucursal) throws Exception {
        String texto = "Frase: Tipo " + sucursal.getFelTipoFrase()
                + " - Escenario " + sucursal.getFelCodigoEscenario();
        document.add(parrafoCompacto(texto, FUENTE_NORMAL));
        agregarEspacio(document, 4f);
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

        for (VentaDetalle d : detalles) {
            Articulo articulo = articulosPorId.get(d.getIdArticulo());
            BigDecimal descuento = d.getMontoDescuentoMayorista().add(d.getMontoDescuentoManual());

            agregarCeldaTexto(tabla, articulo.getNombre(), Element.ALIGN_LEFT);
            agregarCeldaTexto(tabla, d.getCantidad().toPlainString(), Element.ALIGN_RIGHT);
            agregarCeldaTexto(tabla, d.getPrecioUnitario().setScale(2, RoundingMode.HALF_UP).toPlainString(), Element.ALIGN_RIGHT);
            agregarCeldaTexto(tabla, descuento.setScale(2, RoundingMode.HALF_UP).toPlainString(), Element.ALIGN_RIGHT);
            agregarCeldaTexto(tabla, d.getSubtotal().setScale(2, RoundingMode.HALF_UP).toPlainString(), Element.ALIGN_RIGHT);
        }

        document.add(tabla);
        document.add(new Paragraph(" "));
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

    private void agregarTotales(Document document, Venta venta, VentaFel ventaFel) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(45f);
        tabla.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.setWidths(new float[]{60f, 40f});

        agregarFilaTotal(tabla, "Subtotal (bruto):", venta.getSubtotal(), false);
        agregarFilaTotal(tabla, "Descuento total:", venta.getDescuentoTotal().negate(), false);
        if (ventaFel.getMontoGravable() != null) {
            agregarFilaTotal(tabla, "Monto gravable:", ventaFel.getMontoGravable(), false);
        }
        if (ventaFel.getMontoImpuestoIva() != null) {
            agregarFilaTotal(tabla, "IVA (12%):", ventaFel.getMontoImpuestoIva(), false);
        }
        agregarFilaTotal(tabla, "TOTAL A PAGAR:", venta.getTotal(), true);

        document.add(tabla);
        agregarEspacio(document, 6f);
    }

    private void agregarFilaTotal(PdfPTable tabla, String etiqueta, BigDecimal valor, boolean destacado) {
        Font fuente = destacado ? FUENTE_NEGRITA : FUENTE_NORMAL;

        PdfPCell celdaEtiqueta = new PdfPCell(new Phrase(etiqueta, fuente));
        celdaEtiqueta.setBorder(Rectangle.NO_BORDER);
        celdaEtiqueta.setPadding(2f);
        celdaEtiqueta.setHorizontalAlignment(Element.ALIGN_LEFT);
        tabla.addCell(celdaEtiqueta);

        PdfPCell celdaValor = new PdfPCell(new Phrase(valor.setScale(2, RoundingMode.HALF_UP).toPlainString(), fuente));
        celdaValor.setBorder(Rectangle.NO_BORDER);
        celdaValor.setPadding(2f);
        celdaValor.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.addCell(celdaValor);
    }

    private void agregarCertificacion(Document document, VentaFel ventaFel) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{75f, 25f});

        PdfPCell celdaTexto = new PdfPCell();
        celdaTexto.setBorder(Rectangle.NO_BORDER);
        celdaTexto.addElement(parrafoCompacto("Certificación", FUENTE_SUBTITULO));
        celdaTexto.addElement(parrafoCompacto("Certificador: " + valorOTexto(ventaFel.getNombreCertificador()), FUENTE_NORMAL));
        celdaTexto.addElement(parrafoCompacto("NIT Certificador: " + valorOTexto(ventaFel.getNitCertificador()), FUENTE_NORMAL));
        celdaTexto.addElement(parrafoCompacto("Fecha certificación: " + formatearFecha(ventaFel.getFechaHoraCertificacion()), FUENTE_NORMAL));
        celdaTexto.addElement(parrafoCompacto("No. autorización: " + valorOTexto(ventaFel.getNumeroAutorizacion()), FUENTE_NORMAL));
        tabla.addCell(celdaTexto);

        PdfPCell celdaQr = new PdfPCell();
        celdaQr.setBorder(Rectangle.NO_BORDER);
        celdaQr.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Image qr = cargarQr(ventaFel.getCodigoQR());
        if (qr != null) {
            qr.scaleToFit(80f, 80f);
            celdaQr.addElement(qr);
        }
        tabla.addCell(celdaQr);

        document.add(tabla);
        agregarEspacio(document, 6f);
    }

    private Image cargarQr(String codigoQrBase64) {
        if (codigoQrBase64 == null || codigoQrBase64.isBlank()) {
            return null;
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(codigoQrBase64);
            return Image.getInstance(bytes);
        } catch (Exception e) {
            return null;
        }
    }

    private void agregarAnulacion(Document document, VentaFel ventaFel) throws Exception {
        PdfPTable tabla = new PdfPTable(1);
        tabla.setWidthPercentage(100);

        PdfPCell celda = new PdfPCell();
        celda.setPadding(8f);
        celda.setBackgroundColor(new Color(255, 235, 235));

        Paragraph titulo = parrafoCompacto("DOCUMENTO ANULADO", FUENTE_ANULADO, Element.ALIGN_CENTER);
        celda.addElement(titulo);
        celda.addElement(parrafoCompacto("Fecha de anulación: " + formatearFecha(ventaFel.getFechaHoraAnulacion()), FUENTE_NORMAL));
        celda.addElement(parrafoCompacto("Motivo: " + valorOTexto(ventaFel.getMotivoAnulacion()), FUENTE_NORMAL));

        tabla.addCell(celda);
        document.add(tabla);
    }

    private String valorOTexto(String valor) {
        return (valor == null || valor.isBlank()) ? "-" : valor;
    }

    private String formatearFecha(LocalDateTime fecha) {
        if (fecha == null) return "-";
        return fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
    }
}
