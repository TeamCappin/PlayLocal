package com.backend.playlocal.service.knowledge;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public final class TextTokenizer {

    private TextTokenizer() {
    }

    public static List<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String norm = text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s]", " ");
        return Arrays.stream(norm.split("\\s+"))
                .filter(s -> s.length() > 1)
                .collect(Collectors.toList());
    }
}
