package com.femaco.main.Service.Ventas;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Ventas.VentaFel;
import com.femaco.main.Repository.Ventas.VentaFelRepository;

@Service
public class VentaFelService {

    private final VentaFelRepository ventaFelRepository;

    public VentaFelService(VentaFelRepository ventaFelRepository) {
        this.ventaFelRepository = ventaFelRepository;
    }

    public List<VentaFel> buscarTodos() {
        return ventaFelRepository.findAll();
    }

    public Optional<VentaFel> buscarPorId(Long idVentaFel) {
        return ventaFelRepository.findById(idVentaFel);
    }

    public Optional<VentaFel> buscarPorIdVenta(Long idVenta) {
        return ventaFelRepository.findByIdVenta(idVenta);
    }

    @Transactional
    public VentaFel guardar(VentaFel ventaFel) {
        LocalDateTime ahora = LocalDateTime.now();

        if (ventaFel.getIdVentaFel() == null) {
            ventaFel.setFechaCreacion(ahora);
            ventaFel.setUsuarioCreacion(ventaFel.getUsuarioCreacion());
        }

        ventaFel.setFechaModif(ahora);
        ventaFel.setUsuarioModif(ventaFel.getUsuarioModif());

        return ventaFelRepository.save(ventaFel);
    }

    @Transactional
    public Optional<VentaFel> actualizar(Long idVentaFel, VentaFel datosNuevos) {
        return ventaFelRepository.findById(idVentaFel).map(existente -> {
            existente.setIdVenta(datosNuevos.getIdVenta());
            existente.setTipoDte(datosNuevos.getTipoDte());
            existente.setNumeroAutorizacion(datosNuevos.getNumeroAutorizacion());
            existente.setSerieDocumento(datosNuevos.getSerieDocumento());
            existente.setNumeroDocumento(datosNuevos.getNumeroDocumento());
            existente.setFechaHoraEmision(datosNuevos.getFechaHoraEmision());
            existente.setFechaHoraCertificacion(datosNuevos.getFechaHoraCertificacion());
            existente.setNitCertificador(datosNuevos.getNitCertificador());
            existente.setNombreCertificador(datosNuevos.getNombreCertificador());
            existente.setMontoGravable(datosNuevos.getMontoGravable());
            existente.setMontoImpuestoIva(datosNuevos.getMontoImpuestoIva());
            existente.setGranTotal(datosNuevos.getGranTotal());
            existente.setEstadoDocumento(datosNuevos.getEstadoDocumento());
            existente.setXmlCertificado(datosNuevos.getXmlCertificado());
            existente.setCodigoQR(datosNuevos.getCodigoQR());
            existente.setCodigoErrorCertificacion(datosNuevos.getCodigoErrorCertificacion());
            existente.setMensajeErrorCertificacion(datosNuevos.getMensajeErrorCertificacion());
            existente.setFechaHoraAnulacion(datosNuevos.getFechaHoraAnulacion());
            existente.setMotivoAnulacion(datosNuevos.getMotivoAnulacion());
            existente.setXmlAnulacionCertificado(datosNuevos.getXmlAnulacionCertificado());
            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return ventaFelRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idVentaFel) {
        if (!ventaFelRepository.existsById(idVentaFel)) {
            return false;
        }
        ventaFelRepository.deleteById(idVentaFel);
        return true;
    }

}
