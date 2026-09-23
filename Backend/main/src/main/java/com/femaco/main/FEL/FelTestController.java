package com.femaco.main.FEL;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/fel/test")
public class FelTestController {

    private final FelConectividadService conectividadService;

    public FelTestController(FelConectividadService conectividadService) {
        this.conectividadService = conectividadService;
    }

    @GetMapping("/conexion")
    public FelConectividadService.ResultadoConectividad probarConexion() {
        return conectividadService.probarConexion();
    }

}