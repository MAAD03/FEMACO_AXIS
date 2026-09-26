package com.femaco.main.FEL;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

@RestControllerAdvice(assignableTypes = FelOperacionesController.class)
public class FelExceptionHandler {

    @ExceptionHandler(TekraRechazoException.class)
    public ResponseEntity<FelErrorResponse> manejarRechazoTekra(TekraRechazoException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new FelErrorResponse("TEKRA", e.getMessage()));
    }

    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<FelErrorResponse> manejarErrorRedTekra(RestClientException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new FelErrorResponse("TEKRA", "No se pudo comunicar con el certificador: " + e.getMessage()));
    }

    @ExceptionHandler(FelPdfGenerationException.class)
    public ResponseEntity<FelErrorResponse> manejarErrorPdf(FelPdfGenerationException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new FelErrorResponse("PDF", e.getMessage()));
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<FelErrorResponse> manejarErrorValidacion(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new FelErrorResponse("VALIDACION", e.getMessage()));
    }
}
