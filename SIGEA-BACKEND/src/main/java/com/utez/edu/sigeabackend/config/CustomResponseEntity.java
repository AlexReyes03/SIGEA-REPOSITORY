package com.utez.edu.sigeabackend.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class CustomResponseEntity {
    public ResponseEntity<?> createResponse(String message, HttpStatus httpStatus, Object data){
        Map<String, Object> body = new HashMap<>();
        body.put("message",message);
        body.put("status", httpStatus.getReasonPhrase());
        body.put("code", httpStatus.value());
        if(data != null){
            body.put("data",data);
        }
        return new ResponseEntity<>(body, httpStatus);
    }

    public ResponseEntity<?> getOkResponse(String message, Object data){
        return createResponse(message,HttpStatus.OK,data);
    }

    public ResponseEntity<?> get201Response(String message){
        return createResponse(message,HttpStatus.CREATED,null);
    }

    public ResponseEntity<?> get404Response() {
        return createResponse("Recurso no encontrado", HttpStatus.NOT_FOUND, null);
    }

    public ResponseEntity<?> get400Response() {
        return createResponse("Error al realizar la operación", HttpStatus.BAD_REQUEST, null);
    }

    public ResponseEntity<?> get405Response() {
        return createResponse("Método no permitido", HttpStatus.METHOD_NOT_ALLOWED, null);
    }
}
