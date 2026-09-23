package com.femaco.main.FEL;

public final class FelXmlTextUtil {

    private FelXmlTextUtil() {}

    /**
     * El certificador TEKRA exige que el XML del DTE NO contenga caracteres
     * de escape "<", ">" ni "?" (deben omitirse por completo, no escaparse),
     * y que "&" sí se codifique como &amp;. Esto es distinto al escape XML
     * estándar, respétalo tal cual.
     */
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
