package com.femaco.main.Service.Ventas;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.SucursalCotizacion.Sucursal;
import com.femaco.main.Entity.Ventas.Pedido;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.SucursalCotizacion.SucursalRepository;
import com.femaco.main.Repository.Ventas.PedidoRepository;
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
public class PedidoPdfService {

    private static final String RUTA_LOGO = "fel/logo-sucursal.png";
    private static final float ANCHO_CARTA = 612f;
    private static final float MARGEN = 36f;
    private static final float ALTO_MINIMO = 330f;
    private static final float ALTO_MAXIMO = 792f * 3;
    private static final float ALTURA_ENCABEZADO = 90f;
    private static final float ALTURA_FILA_BASE = 27f;
    private static final float ALTURA_POR_LINEA_EXTRA = 12f;
    private static final float MARGEN_SUPERIOR_INFERIOR = MARGEN * 2;
    private static final float COLCHON_SEGURIDAD = 16f;
    private static final int CARACTERES_POR_LINEA = 68;

    private static final Font FUENTE_TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15);
    private static final Font FUENTE_NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private static final Font FUENTE_NEGRITA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private static final Font FUENTE_SUCURSAL_NOMBRE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
    private static final Font FUENTE_SUCURSAL_DATOS = FontFactory.getFont(FontFactory.HELVETICA, 10);

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;

    public PedidoPdfService(PedidoRepository pedidoRepository,
                            UsuarioRepository usuarioRepository,
                            SucursalRepository sucursalRepository) {
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
        this.sucursalRepository = sucursalRepository;
    }

    public byte[] generarPdf(Long idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + idPedido));

        Usuario usuario = usuarioRepository.findById(pedido.getUsuarioCreacion().longValue())
                .orElseThrow(() -> new IllegalStateException(
                        "Usuario creador no encontrado para el pedido " + idPedido));
        Sucursal sucursal = sucursalRepository.findById(usuario.getIdSucursal())
                .orElseThrow(() -> new IllegalStateException("Sucursal no encontrada para el pedido " + idPedido));

        try {
            return construirPdf(pedido, sucursal);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el listado de entrega del pedido " + idPedido, e);
        }
    }

    private byte[] construirPdf(Pedido pedido, Sucursal sucursal) throws Exception {
        Document document = new Document(new Rectangle(ANCHO_CARTA, estimarAltoPagina(pedido)));
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        document.setMargins(MARGEN, MARGEN, MARGEN, MARGEN);
        document.open();

        agregarEncabezado(document, sucursal);
        agregarDatosPedido(document, pedido);

        document.close();
        return baos.toByteArray();
    }

    private float estimarAltoPagina(Pedido pedido) {
        float alto = ALTURA_ENCABEZADO + MARGEN_SUPERIOR_INFERIOR + COLCHON_SEGURIDAD;
        alto += alturaFila("Fecha de entrega", pedido.getFechaEntrega() == null ? "-" : pedido.getFechaEntrega().toString());
        alto += alturaFila("Numero de entrega / telefono", pedido.getNumeroEntrega());
        alto += alturaFila("Direccion de entrega", pedido.getDireccionEntrega());
        alto += alturaFila("Producto de pedido", pedido.getProductoDePedido());
        alto += alturaFila("Notas de entrega", pedido.getNotasEntrega());
        return Math.min(Math.max(ALTO_MINIMO, alto), ALTO_MAXIMO);
    }

    private float alturaFila(String etiqueta, String valor) {
        int lineasEtiqueta = (int) Math.ceil(etiqueta.length() / 28d);
        int lineasValor = (int) Math.ceil(valorOTexto(valor).length() / (double) CARACTERES_POR_LINEA);
        int lineas = Math.max(1, Math.max(lineasEtiqueta, lineasValor));
        return ALTURA_FILA_BASE + (lineas - 1) * ALTURA_POR_LINEA_EXTRA;
    }

    private void agregarEncabezado(Document document, Sucursal sucursal) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{58f, 42f});

        PdfPCell datosSucursal = celdaSinBorde();
        Image logo = cargarLogo();
        if (logo != null) {
            logo.scaleToFit(115f, 52f);
            datosSucursal.addElement(logo);
        }
        datosSucursal.addElement(new Phrase("Sucursal: " + valorOTexto(sucursal.getNombre()), FUENTE_SUCURSAL_NOMBRE));
        datosSucursal.addElement(new Phrase(valorOTexto(sucursal.getDireccion()), FUENTE_SUCURSAL_DATOS));
        datosSucursal.addElement(new Phrase("Tel: " + valorOTexto(sucursal.getTelefono()), FUENTE_SUCURSAL_DATOS));
        datosSucursal.setPaddingBottom(8f);
        tabla.addCell(datosSucursal);

        PdfPCell titulo = celdaSinBorde();
        titulo.setHorizontalAlignment(Element.ALIGN_RIGHT);
        titulo.addElement(new Phrase("LISTADO DE ENTREGA", FUENTE_TITULO));
        tabla.addCell(titulo);

        document.add(tabla);
    }

    private void agregarDatosPedido(Document document, Pedido pedido) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{25f, 75f});

        agregarFila(tabla, "Fecha de entrega", formatearFecha(pedido));
        agregarFila(tabla, "Numero de entrega / telefono", valorOTexto(pedido.getNumeroEntrega()));
        agregarFila(tabla, "Direccion de entrega", valorOTexto(pedido.getDireccionEntrega()));
        agregarFilaProducto(tabla, valorOTexto(pedido.getProductoDePedido()));
        agregarFila(tabla, "Notas de entrega", valorOTexto(pedido.getNotasEntrega()));

        document.add(tabla);
    }

    private void agregarFila(PdfPTable tabla, String etiqueta, String valor) {
        PdfPCell celdaEtiqueta = new PdfPCell(new Phrase(etiqueta, FUENTE_NEGRITA));
        celdaEtiqueta.setBackgroundColor(new Color(235, 235, 235));
        celdaEtiqueta.setPadding(6f);
        tabla.addCell(celdaEtiqueta);

        PdfPCell celdaValor = new PdfPCell(new Phrase(valor, FUENTE_NORMAL));
        celdaValor.setPadding(6f);
        tabla.addCell(celdaValor);
    }

    private void agregarFilaProducto(PdfPTable tabla, String valor) {
        PdfPCell celdaEtiqueta = new PdfPCell(new Phrase("Producto de pedido", FUENTE_NEGRITA));
        celdaEtiqueta.setBackgroundColor(new Color(235, 235, 235));
        celdaEtiqueta.setPadding(6f);
        tabla.addCell(celdaEtiqueta);

        Paragraph producto = new Paragraph(valor, FUENTE_NORMAL);
        producto.setLeading(FUENTE_NORMAL.getSize() * 1.35f);
        PdfPCell celdaValor = new PdfPCell();
        celdaValor.setPadding(6f);
        celdaValor.addElement(producto);
        tabla.addCell(celdaValor);
    }

    private PdfPCell celdaSinBorde() {
        PdfPCell celda = new PdfPCell();
        celda.setBorder(Rectangle.NO_BORDER);
        celda.setPadding(0f);
        return celda;
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

    private String formatearFecha(Pedido pedido) {
        return pedido.getFechaEntrega() == null
                ? "-"
                : pedido.getFechaEntrega().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String valorOTexto(Object valor) {
        return valor == null ? "-" : valor.toString().isBlank() ? "-" : valor.toString();
    }
}