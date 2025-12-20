package com.playlocal.backend.repository;

import com.playlocal.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCity(String city);
    List<Project> findByStatus(String status);
}
