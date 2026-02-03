package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.EndorsementDto;
import com.backend.playlocal.service.EndorsementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class EndorsementController {

    private final EndorsementService endorsementService;

    public EndorsementController(EndorsementService endorsementService) {
        this.endorsementService = endorsementService;
    }

    @PostMapping("/endorsements")
    public ResponseEntity<EndorsementDto.Response> createEndorsement(
            @Valid @RequestBody EndorsementDto.CreateRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        EndorsementDto.Response response = endorsementService.createEndorsement(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/users/{userId}/endorsements")
    public ResponseEntity<List<EndorsementDto.Response>> getUserEndorsements(
            @PathVariable UUID userId) {
        List<EndorsementDto.Response> endorsements = endorsementService.getUserEndorsements(userId);
        return ResponseEntity.ok(endorsements);
    }
}
