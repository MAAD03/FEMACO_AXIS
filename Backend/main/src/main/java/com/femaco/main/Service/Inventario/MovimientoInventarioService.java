package com.femaco.main.Service.Inventario;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.femaco.main.Entity.Inventario.MovimientoInventario;
import com.femaco.main.Repository.Inventario.MovimientoInventarioRepository;

@Service
public class MovimientoInventarioService {

    private final MovimientoInventarioRepository movimientoInventarioRepository;

    public MovimientoInventarioService(MovimientoInventarioRepository movimientoInventarioRepository) {
        this.movimientoInventarioRepository = movimientoInventarioRepository;
    }

    public List<MovimientoInventario> buscarTodos() {
        return movimientoInventarioRepository.findAll();
    }

    public Page<MovimientoInventario> buscarTodosPaginado(Pageable pageable) {
        return movimientoInventarioRepository
                .findAllByOrderByFechaCreacionDescIdMovimientoInventarioDesc(pageable);
    }

    public List<MovimientoInventario> buscarPorArticulo(Long idArticulo) {
        return movimientoInventarioRepository.findByIdArticulo(idArticulo);
    }

    public List<MovimientoInventario> buscarPorVenta(Long idVenta) {
        return movimientoInventarioRepository.findByIdVenta(idVenta);
    }

    public List<MovimientoInventario> buscarPorOrdenCompra(Long idOrdenCompra) {
        return movimientoInventarioRepository.findByIdOrdenCompra(idOrdenCompra);
    }
}
