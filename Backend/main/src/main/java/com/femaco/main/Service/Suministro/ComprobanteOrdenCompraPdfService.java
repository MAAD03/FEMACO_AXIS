package com.femaco.main.Service.Suministro;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.femaco.main.Entity.Inventario.Articulo;
import com.femaco.main.Entity.Suministro.OrdenCompra;
import com.femaco.main.Entity.Suministro.OrdenCompraDetalle;
import com.femaco.main.Entity.Suministro.Proveedor;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
import com.femaco.main.Repository.Suministro.OrdenCompraDetalleRepository;
import com.femaco.main.Repository.Suministro.OrdenCompraRepository;
import com.femaco.main.Repository.Suministro.ProveedorRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class ComprobanteOrdenCompraPdfService {

    private static final Font FUENTE_TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
    private static final Font FUENTE_SUBTITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private static final Font FUENTE_NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 9);
    private static final Font FUENTE_NEGRITA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font FUENTE_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font FUENTE_TABLA_CELDA = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private static final float GROSOR_BORDE_TABLA = 0.25f;
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final OrdenCompraRepository ordenCompraRepository;
    private final OrdenCompraDetalleRepository detalleRepository;
    private final ProveedorRepository proveedorRepository;
    private final ArticuloRepository articuloRepository;

    public ComprobanteOrdenCompraPdfService(OrdenCompraRepository ordenCompraRepository,
                                            OrdenCompraDetalleRepository detalleRepository,
                                            ProveedorRepository proveedorRepository,
                                            ArticuloRepository articuloRepository) {
        this.ordenCompraRepository = ordenCompraRepository;
        this.detalleRepository = detalleRepository;
        this.proveedorRepository = proveedorRepository;
        this.articuloRepository = articuloRepository;
    }

    public byte[] generarPdf(Long idOrdenCompra) {
        OrdenCompra orden = ordenCompraRepository.findById(idOrdenCompra)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Orden de compra no encontrada: " + idOrdenCompra));
        if (orden.getIdProveedor() == null) {
            throw new IllegalStateException(
                    "La orden de compra " + idOrdenCompra + " no tiene un proveedor asociado.");
        }
        Proveedor proveedor = proveedorRepository.findById(orden.getIdProveedor())
                .orElseThrow(() -> new IllegalStateException(
                        "Proveedor no encontrado para la orden de compra " + idOrdenCompra));
        List<OrdenCompraDetalle> detalles = detalleRepository.findByIdOrdenCompra(idOrdenCompra);
        if (detalles.isEmpty()) {
            throw new IllegalStateException(
                    "La orden de compra " + idOrdenCompra + " no tiene artículos en el detalle.");
        }

        Map<Long, Articulo> articulosPorId = new HashMap<>();
        for (OrdenCompraDetalle detalle : detalles) {
            if (detalle.getIdArticulo() == null) {
                throw new IllegalStateException(
                        "Un detalle de la orden de compra " + idOrdenCompra + " no tiene un artículo asociado.");
            }
            Articulo articulo = articuloRepository.findById(detalle.getIdArticulo())
                    .orElseThrow(() -> new IllegalStateException(
                            "Artículo no encontrado: " + detalle.getIdArticulo()));
            articulosPorId.put(detalle.getIdArticulo(), articulo);
        }

        try {
            return construirPdf(orden, proveedor, detalles, articulosPorId);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "No se pudo generar el comprobante de la orden de compra " + idOrdenCompra, e);
        }
    }

    private byte[] construirPdf(OrdenCompra orden, Proveedor proveedor,
                                List<OrdenCompraDetalle> detalles,
                                Map<Long, Articulo> articulosPorId) throws Exception {
        Document document = new Document(PageSize.LETTER, 36f, 36f, 32f, 32f);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, output);
        document.open();

        Paragraph titulo = new Paragraph("COMPROBANTE DE ORDEN DE COMPRA", FUENTE_TITULO);
        titulo.setAlignment(Element.ALIGN_CENTER);
        titulo.setSpacingAfter(12f);
        document.add(titulo);

        agregarDatosOrdenYProveedor(document, orden, proveedor);
        agregarTablaDetalles(document, detalles, articulosPorId);
        agregarTotal(document, orden.getTotal());
        agregarNotas(document, orden.getNotas());
        agregarFirmas(document);

        document.close();
        return output.toByteArray();
    }

    private void agregarDatosOrdenYProveedor(Document document, OrdenCompra orden, Proveedor proveedor)
            throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{65f, 35f});

        PdfPCell proveedorCelda = celdaSinBorde();
        proveedorCelda.addElement(new Paragraph("PROVEEDOR", FUENTE_SUBTITULO));
        proveedorCelda.addElement(parrafoCompacto("Nombre: " + valorOTexto(proveedor.getNombre())));
        proveedorCelda.addElement(parrafoCompacto("NIT: " + valorOTexto(proveedor.getNit())));
        proveedorCelda.addElement(parrafoCompacto("Contacto: " + valorOTexto(proveedor.getNombreContacto())));
        proveedorCelda.addElement(parrafoCompacto("Teléfono: " + valorOTexto(proveedor.getTelefono())));
        proveedorCelda.addElement(parrafoCompacto("Dirección: " + valorOTexto(proveedor.getDireccion())));
        tabla.addCell(proveedorCelda);

        PdfPCell ordenCelda = celdaSinBorde();
        ordenCelda.setHorizontalAlignment(Element.ALIGN_RIGHT);
        ordenCelda.addElement(parrafoNegrita("ORDEN No. " + orden.getIdOrdenCompra()));
        ordenCelda.addElement(parrafo("Fecha: " + formatearFecha(orden.getFechaCreacion())));
        tabla.addCell(ordenCelda);

        document.add(tabla);
        Paragraph espacio = new Paragraph(" ");
        espacio.setSpacingAfter(4f);
        document.add(espacio);
    }

    private void agregarTablaDetalles(Document document, List<OrdenCompraDetalle> detalles,
                                      Map<Long, Articulo> articulosPorId) throws Exception {
        PdfPTable tabla = new PdfPTable(5);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{43f, 14f, 15f, 15f, 13f});
        tabla.setHeaderRows(1);

        agregarCeldaHeader(tabla, "Artículo");
        agregarCeldaHeader(tabla, "Cantidad solicitada");
        agregarCeldaHeader(tabla, "Precio unitario");
        agregarCeldaHeader(tabla, "Total");
        agregarCeldaHeader(tabla, "Cantidad recibida");

        for (OrdenCompraDetalle detalle : detalles) {
            Articulo articulo = articulosPorId.get(detalle.getIdArticulo());
            String articuloTexto = "ID: " + articulo.getIdArticulo()
                    + "\nCódigo: " + valorOTexto(articulo.getCodigo())
                    + "\n" + valorOTexto(articulo.getNombre());
            agregarCelda(tabla, articuloTexto, FUENTE_TABLA_CELDA, Element.ALIGN_LEFT);
            agregarCelda(tabla, decimal(detalle.getCantidad()), FUENTE_TABLA_CELDA, Element.ALIGN_RIGHT);
            agregarCelda(tabla, dinero(detalle.getPrecioUnitario()), FUENTE_TABLA_CELDA, Element.ALIGN_RIGHT);
            agregarCelda(tabla, dinero(detalle.getTotal()), FUENTE_TABLA_CELDA, Element.ALIGN_RIGHT);
            agregarCelda(tabla, " ", FUENTE_TABLA_CELDA, Element.ALIGN_CENTER);
        }

        document.add(tabla);
    }

    private void agregarTotal(Document document, BigDecimal total) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(35f);
        tabla.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.setWidths(new float[]{55f, 45f});

        PdfPCell etiqueta = new PdfPCell(new Phrase("TOTAL DE LA ORDEN", FUENTE_NEGRITA));
        etiqueta.setBorder(Rectangle.NO_BORDER);
        etiqueta.setPadding(5f);
        tabla.addCell(etiqueta);

        PdfPCell monto = new PdfPCell(new Phrase("Q " + dinero(total), FUENTE_NEGRITA));
        monto.setBorder(Rectangle.NO_BORDER);
        monto.setPadding(5f);
        monto.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.addCell(monto);
        document.add(tabla);
    }

    private void agregarNotas(Document document, String notas) throws Exception {
        Paragraph titulo = new Paragraph("Notas", FUENTE_SUBTITULO);
        titulo.setSpacingBefore(6f);
        titulo.setSpacingAfter(2f);
        document.add(titulo);
        document.add(new Paragraph(valorOTexto(notas), FUENTE_NORMAL));
    }

    private void agregarFirmas(Document document) throws Exception {
        Paragraph espacio = new Paragraph(" ");
        espacio.setSpacingBefore(24f);
        document.add(espacio);

        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{50f, 50f});
        agregarCeldaFirma(tabla, "Entrega proveedor");
        agregarCeldaFirma(tabla, "Recibido y verificado por");
        document.add(tabla);
    }

    private void agregarCeldaFirma(PdfPTable tabla, String texto) {
        PdfPCell celda = celdaSinBorde();
        celda.setHorizontalAlignment(Element.ALIGN_CENTER);
        celda.setPaddingTop(20f);
        Paragraph linea = new Paragraph("________________________________________", FUENTE_NORMAL);
        linea.setAlignment(Element.ALIGN_CENTER);
        celda.addElement(linea);
        Paragraph etiqueta = new Paragraph(texto, FUENTE_NORMAL);
        etiqueta.setAlignment(Element.ALIGN_CENTER);
        celda.addElement(etiqueta);
        tabla.addCell(celda);
    }

    private void agregarCeldaHeader(PdfPTable tabla, String texto) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, FUENTE_HEADER));
        celda.setHorizontalAlignment(Element.ALIGN_CENTER);
        celda.setVerticalAlignment(Element.ALIGN_MIDDLE);
        celda.setBackgroundColor(new Color(230, 230, 230));
        celda.setPadding(3f);
        celda.setBorderWidth(GROSOR_BORDE_TABLA);
        tabla.addCell(celda);
    }

    private void agregarCelda(PdfPTable tabla, String texto, Font fuente, int alineacion) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, fuente));
        celda.setHorizontalAlignment(alineacion);
        celda.setVerticalAlignment(Element.ALIGN_MIDDLE);
        celda.setPadding(2f);
        celda.setBorderWidth(GROSOR_BORDE_TABLA);
        tabla.addCell(celda);
    }

    private PdfPCell celdaSinBorde() {
        PdfPCell celda = new PdfPCell();
        celda.setBorder(Rectangle.NO_BORDER);
        celda.setPadding(4f);
        return celda;
    }

    private Paragraph parrafo(String texto) {
        return new Paragraph(texto, FUENTE_NORMAL);
    }

    private Paragraph parrafoCompacto(String texto) {
        Paragraph parrafo = new Paragraph(texto, FUENTE_NORMAL);
        parrafo.setLeading(FUENTE_NORMAL.getSize() * 1.05f);
        parrafo.setSpacingAfter(0f);
        return parrafo;
    }

    private Paragraph parrafoNegrita(String texto) {
        return new Paragraph(texto, FUENTE_NEGRITA);
    }

    private String decimal(BigDecimal valor) {
        return valorDecimal(valor).stripTrailingZeros().toPlainString();
    }

    private String dinero(BigDecimal valor) {
        return valorDecimal(valor).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private BigDecimal valorDecimal(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    private String valorOTexto(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor;
    }

    private String formatearFecha(LocalDateTime fecha) {
        return fecha == null ? "-" : fecha.format(FORMATO_FECHA);
    }
}
