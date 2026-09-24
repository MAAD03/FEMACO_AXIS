package com.femaco.main.FEL;

public final class FelXmlTextUtil {

    private FelXmlTextUtil() {}

    public static String escapar(String valor) {
        if (valor == null) return "";
        return valor
                .replace("&", "&amp;")
                .replace("<", "")
                .replace(">", "")
                .replace("?", "")
                .trim();
    }
}
