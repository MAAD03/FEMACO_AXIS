package com.femaco.main.FEL;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import com.femaco.main.Config.FEL.FelProperties;
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

@Service
public class FelDteBuilderService {

    private final FelProperties felProperties;

    private final FelDteFacturaBuilder facturaBuilder;
    private final FelDteAnulacionBuilder anulacionBuilder;
    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;
    private final ArticuloRepository articuloRepository;
    private final VentaFelRepository ventaFelRepository;
    

    public FelDteBuilderService(FelDteFacturaBuilder facturaBuilder,
                                 FelDteAnulacionBuilder anulacionBuilder,
                                 VentaRepository ventaRepository,
                                 VentaDetalleRepository ventaDetalleRepository,
                                 ClienteRepository clienteRepository,
                                 UsuarioRepository usuarioRepository,
                                 SucursalRepository sucursalRepository,
                                 ArticuloRepository articuloRepository,
                                 VentaFelRepository ventaFelRepository,
                                 FelProperties felProperties) {
        this.facturaBuilder = facturaBuilder;
        this.anulacionBuilder = anulacionBuilder;
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.sucursalRepository = sucursalRepository;
        this.articuloRepository = articuloRepository;
        this.ventaFelRepository = ventaFelRepository;
        this.felProperties = felProperties;
    }

    public record DteFacturaGenerado(String xml, BigDecimal montoGravable,
                                      BigDecimal montoImpuestoIva, BigDecimal granTotal) {}

    public DteFacturaGenerado armarDteFactura(Long idVenta) {
        Venta venta = ventaRepository.findById(idVenta)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada: " + idVenta));

        Cliente cliente = clienteRepository.findById(venta.getIdCliente())
                .orElseThrow(() -> new IllegalStateException("Cliente no encontrado para la venta " + idVenta));

        Usuario usuario = usuarioRepository.findById(venta.getIdUsuario())
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado para la venta " + idVenta));

        Sucursal sucursal = sucursalRepository.findById(usuario.getIdSucursal())
                .orElseThrow(() -> new IllegalStateException("Sucursal no encontrada para el usuario " + usuario.getIdUsuario()));

        List<VentaDetalle> detalles = ventaDetalleRepository.findByIdVenta(idVenta);
        if (detalles.isEmpty()) {
            throw new IllegalStateException("La venta " + idVenta + " no tiene artículos en el detalle.");
        }

        FelEmisorContexto emisor = mapearEmisor(sucursal);
        FelReceptorContexto receptor = mapearReceptor(cliente);
        List<FelItemContexto> items = detalles.stream().map(this::mapearItem).collect(Collectors.toList());

        
        String sufijo = felProperties.getDev().getSufijoIdentificador();
        String identificadorUnico = (sufijo != null && !sufijo.isBlank())
        ? idVenta + "-" + sufijo
        : idVenta.toString();

        FelDteFacturaBuilder.ResultadoFactura resultado =
                facturaBuilder.construirXml(emisor, receptor, items, identificadorUnico);

        BigDecimal diferencia = resultado.granTotalCalculado().subtract(venta.getTotal()).abs();
        if (diferencia.compareTo(new BigDecimal("0.05")) > 0) {
            throw new IllegalStateException(
                    "El total calculado del DTE (" + resultado.granTotalCalculado() +
                    ") no coincide con el total de la venta (" + venta.getTotal() + "). Verifique venta_detalle.");
        }

        BigDecimal montoGravable = resultado.granTotalCalculado().subtract(resultado.totalImpuestoCalculado());

        return new DteFacturaGenerado(resultado.xml(), montoGravable,
                resultado.totalImpuestoCalculado(), resultado.granTotalCalculado());
    }

    public String armarDteAnulacion(Long idVenta, String motivoAnulacion) {
    VentaFel ventaFel = ventaFelRepository.findByIdVenta(idVenta)
            .orElseThrow(() -> new IllegalStateException("La venta " + idVenta + " no tiene una certificación FEL previa."));

    if (!"VIGENTE".equalsIgnoreCase(ventaFel.getEstadoDocumento())) {
        throw new IllegalStateException("El documento de la venta " + idVenta +
                " no está VIGENTE (estado actual: " + ventaFel.getEstadoDocumento() + ").");
    }

    if (ventaFel.getXmlCertificado() == null || ventaFel.getXmlCertificado().isBlank()) {
        throw new IllegalStateException("La venta " + idVenta +
                " no tiene el XML certificado almacenado; no se puede anular con seguridad.");
    }

    DatosDocumentoCertificado datos = extraerDatosCertificados(ventaFel.getXmlCertificado());

    return anulacionBuilder.construirXml(
            ventaFel.getNumeroAutorizacion(),
            datos.nitEmisor(),
            datos.idReceptor(),
            datos.fechaHoraEmision(),
            motivoAnulacion
    );
}

    private FelEmisorContexto mapearEmisor(Sucursal s) {
        return new FelEmisorContexto(
                s.getFelNitEmisor(), s.getFelNombreEmisor(), s.getFelNombreComercial(), s.getFelCorreoEmisor(),
                s.getFelCodigoEstablecimiento(), s.getFelAfiliacionIva(),
                s.getFelDireccion(), s.getFelCodigoPostal(), s.getFelMunicipio(), s.getFelDepartamento(), s.getFelPais(),
                s.getFelTipoFrase(), s.getFelCodigoEscenario()
        );
    }

    private FelReceptorContexto mapearReceptor(Cliente c) {
        return new FelReceptorContexto(c.getNit(), c.getNombre(), c.getCorreo(), c.getDireccion());
    }

    private FelItemContexto mapearItem(VentaDetalle d) {
        Articulo articulo = articuloRepository.findById(d.getIdArticulo())
                .orElseThrow(() -> new IllegalStateException("Artículo no encontrado: " + d.getIdArticulo()));

        BigDecimal descuentoMonto = d.getMontoDescuentoMayorista().add(d.getMontoDescuentoManual());

        return new FelItemContexto(articulo.getNombre(), d.getCantidad(), d.getPrecioUnitario(),
                descuentoMonto, d.getSubtotal());
    }

    private record DatosDocumentoCertificado(String nitEmisor, String idReceptor, OffsetDateTime fechaHoraEmision) {}

    private DatosDocumentoCertificado extraerDatosCertificados(String xmlCertificado) {
        try {
                DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                factory.setNamespaceAware(true);
                factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
                DocumentBuilder builder = factory.newDocumentBuilder();
                Document doc = builder.parse(new ByteArrayInputStream(xmlCertificado.getBytes(StandardCharsets.UTF_8)));
                Element raiz = doc.getDocumentElement();
                String nitEmisor = atributoDeHijo(raiz, "Emisor", "NITEmisor");
                String idReceptor = atributoDeHijo(raiz, "Receptor", "IDReceptor");
                String fechaEmisionStr = atributoDeHijo(raiz, "DatosGenerales", "FechaHoraEmision");
                if (nitEmisor == null || idReceptor == null || fechaEmisionStr == null) {
                throw new IllegalStateException(
                        "El XML certificado no contiene NITEmisor, IDReceptor o FechaHoraEmision esperados.");
                }
                return new DatosDocumentoCertificado(nitEmisor, idReceptor, OffsetDateTime.parse(fechaEmisionStr));
        } catch (IllegalStateException e) {
                throw e;
        } catch (ParserConfigurationException | SAXException | IOException | DateTimeParseException e) {
                throw new IllegalStateException("No se pudo leer el XML certificado de la venta: " + e.getMessage(), e);
                }
        }

   private String atributoDeHijo(Element raiz, String nombreLocalElemento, String nombreAtributo) {
        NodeList lista = raiz.getElementsByTagNameNS("*", nombreLocalElemento);
        if (lista.getLength() == 0) return null;
        Node atributo = lista.item(0).getAttributes().getNamedItem(nombreAtributo);
        return atributo != null ? atributo.getNodeValue() : null;
        }

}
