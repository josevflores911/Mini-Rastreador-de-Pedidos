package com.clon.security.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Encaminha as requisições de rotas da SPA (Single Page Application)
 * para o index.html, permitindo que o React Router assuma o roteamento
 * no cliente mesmo em recarregamentos diretos de página (F5) ou URLs compartilhadas.
 */
@Controller
public class SpaForwardController {

    @GetMapping(value = {
            "/login",
            "/cadastro",
            "/pedidos",
            "/pedidos/**",
            "/restaurantes/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
