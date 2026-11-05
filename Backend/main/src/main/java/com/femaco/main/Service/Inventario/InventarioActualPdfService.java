package com.femaco.main.Service.Inventario;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.femaco.main.Entity.Catalogo.UnidadMedida;
import com.femaco.main.Entity.Inventario.Articulo;
import com.femaco.main.Repository.Catalogo.UnidadMedidaRepository;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
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
public class InventarioActualPdfService {

    private static final Long ESTADO_ARTICULO_ACTIVO = 1L;
    private static final BigDecimal INCREMENTO_PRECIO = new BigDecimal("0.05");
    private static final Font FUENTE_TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
    private static final Font FUENTE_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font FUENTE_CELDA = FontFactory.getFont(FontFactory.HELVETICA, 9);

    private final ArticuloRepository articuloRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;

    public InventarioActualPdfService(ArticuloRepository articuloRepository,
                                      UnidadMedidaRepository unidadMedidaRepository) {
        this.articuloRepository = articuloRepository;
        this.unidadMedidaRepository = unidadMedidaRepository;
    }

    public byte[] generarPdf() {
        List<Articulo> articulos = articuloRepository
                .findAllByIdEstadoArticuloOrderByCodigoAsc(ESTADO_ARTICULO_ACTIVO);
        List<Long> idsUnidadMedida = articulos.stream()
                .map(Articulo::getIdUnidadMedida)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> nombresUnidadMedida = new HashMap<>();
        for (UnidadMedida unidadMedida : unidadMedidaRepository.findAllById(idsUnidadMedida)) {
            nombresUnidadMedida.put(unidadMedida.getIdUnidadMedida(), unidadMedida.getNombre());
        }

        try {
            return construirPdf(articulos, nombresUnidadMedida);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el PDF del inventario actual", e);
        }
    }

    private byte[] construirPdf(List<Articulo> articulos, Map<Long, String> nombresUnidadMedida)
            throws Exception {
        Document document = new Document(PageSize.LETTER.rotate(), 36f, 36f, 36f, 36f);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, output);
        document.open();

        Paragraph titulo = new Paragraph("Inventario Actual", FUENTE_TITULO);
        titulo.setAlignment(Element.ALIGN_CENTER);
        titulo.setSpacingAfter(14f);
        document.add(titulo);

        PdfPTable tabla = new PdfPTable(5);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{14f, 36f, 14f, 18f, 18f});
        tabla.setHeaderRows(1);

        agregarCelda(tabla, "Código", FUENTE_HEADER, Element.ALIGN_LEFT);
        agregarCelda(tabla, "Nombre", FUENTE_HEADER, Element.ALIGN_LEFT);
        agregarCelda(tabla, "Stock actual", FUENTE_HEADER, Element.ALIGN_RIGHT);
        agregarCelda(tabla, "Unidad de medida", FUENTE_HEADER, Element.ALIGN_LEFT);
        agregarCelda(tabla, "Precio (Q)", FUENTE_HEADER, Element.ALIGN_RIGHT);

        for (Articulo articulo : articulos) {
            agregarCelda(tabla, valorOTexto(articulo.getCodigo()), FUENTE_CELDA, Element.ALIGN_LEFT);
            agregarCelda(tabla, valorOTexto(articulo.getNombre()), FUENTE_CELDA, Element.ALIGN_LEFT);
            agregarCelda(tabla, decimal(articulo.getStockActual()).setScale(2, RoundingMode.HALF_UP).toPlainString(),
                    FUENTE_CELDA, Element.ALIGN_RIGHT);
            agregarCelda(tabla, nombresUnidadMedida.getOrDefault(articulo.getIdUnidadMedida(), "-"),
                    FUENTE_CELDA, Element.ALIGN_LEFT);
            agregarCelda(tabla, "Q " + calcularPrecio(articulo).toPlainString(),
                    FUENTE_CELDA, Element.ALIGN_RIGHT);
        }

        document.add(tabla);
        document.close();
        return output.toByteArray();
    }

    private void agregarCelda(PdfPTable tabla, String texto, Font fuente, int alineacion) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, fuente));
        celda.setBorder(Rectangle.NO_BORDER);
        celda.setHorizontalAlignment(alineacion);
        celda.setPadding(4f);
        celda.setBorderColor(Color.WHITE);
        tabla.addCell(celda);
    }

    private BigDecimal calcularPrecio(Articulo articulo) {
        BigDecimal precioCompra = decimal(articulo.getPrecioCompraUltimoProveedor());
        BigDecimal margenGanancia = decimal(articulo.getMargenGanancia());
        BigDecimal precioCalculado = precioCompra
                .add(precioCompra.multiply(margenGanancia)
                        .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                .setScale(2, RoundingMode.HALF_UP);

        return precioCalculado.divide(INCREMENTO_PRECIO, 0, RoundingMode.CEILING)
                .multiply(INCREMENTO_PRECIO)
                .setScale(2, RoundingMode.UNNECESSARY);
    }

    private BigDecimal decimal(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    private String valorOTexto(String valor) {
        return valor == null || valor.isBlank() ? "-" : valor;
    }
}
