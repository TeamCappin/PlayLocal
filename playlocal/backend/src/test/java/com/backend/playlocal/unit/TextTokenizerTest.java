package com.backend.playlocal.unit;

import com.backend.playlocal.service.knowledge.TextTokenizer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TextTokenizerTest {

    @Test
    @DisplayName("null or blank yields no tokens")
    void tokenize_NullOrBlank() {
        assertThat(TextTokenizer.tokenize(null)).isEmpty();
        assertThat(TextTokenizer.tokenize("")).isEmpty();
        assertThat(TextTokenizer.tokenize("   \t\n")).isEmpty();
    }

    @Test
    @DisplayName("lowercases, strips punctuation, drops single-character tokens")
    void tokenize_NormalizesAndFiltersShort() {
        assertThat(TextTokenizer.tokenize("How do I BLOCK someone?"))
                .containsExactlyInAnyOrder("how", "do", "block", "someone");
    }

    @Test
    @DisplayName("splits on whitespace and hyphen-like noise")
    void tokenize_MultiWord() {
        assertThat(TextTokenizer.tokenize("reset my password — please"))
                .containsExactlyInAnyOrder("reset", "my", "password", "please");
    }
}
