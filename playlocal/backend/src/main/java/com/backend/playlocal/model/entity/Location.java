package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "location")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "location_id")
    private UUID locationId;

    private String name;

    @Column(name = "address_line")
    private String addressLine;

    private String city;

    private String region;

    @Builder.Default
    private String country = "Canada";

    @Column(name = "postal_code")
    private String postalCode;

    private Float latitude;

    private Float longitude;

    @Column(name = "google_place_id")
    private String googlePlaceId;

    private String notes;
}
