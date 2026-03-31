package com.backend.playlocal.service.knowledge;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Small in-memory TF-IDF index for keyword-style retrieval over a fixed corpus.
 */
public final class TfidfIndex {

    private final List<KnowledgeEntryModel> entries;
    private final List<Map<String, Double>> docVectors;
    private final Map<String, Double> idf;

    public TfidfIndex(List<KnowledgeEntryModel> entries) {
        this.entries = List.copyOf(entries);
        int n = entries.size();
        Map<String, Integer> docFreq = new HashMap<>();
        List<Map<String, Integer>> termCounts = new ArrayList<>();
        for (KnowledgeEntryModel e : entries) {
            Map<String, Integer> tf = termFrequency(TextTokenizer.tokenize(e.searchableText()));
            termCounts.add(tf);
            for (String term : tf.keySet()) {
                docFreq.merge(term, 1, Integer::sum);
            }
        }
        this.idf = new HashMap<>();
        for (Map.Entry<String, Integer> df : docFreq.entrySet()) {
            idf.put(df.getKey(), Math.log((1.0 + n) / (1.0 + df.getValue())) + 1.0);
        }
        this.docVectors = new ArrayList<>();
        for (Map<String, Integer> tf : termCounts) {
            docVectors.add(toWeighted(tf));
        }
    }

    private static Map<String, Integer> termFrequency(List<String> tokens) {
        Map<String, Integer> tf = new HashMap<>();
        for (String t : tokens) {
            tf.merge(t, 1, Integer::sum);
        }
        return tf;
    }

    private Map<String, Double> toWeighted(Map<String, Integer> tf) {
        Map<String, Double> w = new HashMap<>();
        for (Map.Entry<String, Integer> e : tf.entrySet()) {
            double idfVal = idf.getOrDefault(e.getKey(), 0.0);
            w.put(e.getKey(), (1.0 + Math.log(e.getValue())) * idfVal);
        }
        return w;
    }

    public List<ScoredEntry> search(String query, int topK) {
        List<String> qTokens = TextTokenizer.tokenize(query);
        if (qTokens.isEmpty() || entries.isEmpty()) {
            return List.of();
        }
        Map<String, Integer> qTf = termFrequency(qTokens);
        Map<String, Double> qVec = toWeighted(qTf);

        List<ScoredEntry> scored = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            double sim = cosine(qVec, docVectors.get(i));
            if (sim > 0) {
                scored.add(new ScoredEntry(entries.get(i), sim));
            }
        }
        scored.sort((a, b) -> Double.compare(b.score(), a.score()));
        return scored.subList(0, Math.min(topK, scored.size()));
    }

    private static double cosine(Map<String, Double> a, Map<String, Double> b) {
        double dot = 0;
        for (Map.Entry<String, Double> e : a.entrySet()) {
            dot += e.getValue() * b.getOrDefault(e.getKey(), 0.0);
        }
        double na = norm(a);
        double nb = norm(b);
        if (na == 0 || nb == 0) {
            return 0;
        }
        return dot / (na * nb);
    }

    private static double norm(Map<String, Double> v) {
        double s = 0;
        for (double x : v.values()) {
            s += x * x;
        }
        return Math.sqrt(s);
    }

    public record ScoredEntry(KnowledgeEntryModel entry, double score) {
    }
}
