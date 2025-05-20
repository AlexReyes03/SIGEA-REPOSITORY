package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository repository, BCryptPasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public ResponseEntity<List<UserEntity>> listAll() {
        List<UserEntity> users = repository.findAll();
        return ResponseEntity.ok(users);
    }

    public ResponseEntity<UserEntity> findById(long id) {
        Optional<UserEntity> optUser = repository.findById(id);
        return optUser.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    public ResponseEntity<UserEntity> create(UserEntity user) {
        if (repository.existsByEmail(user.getEmail()) || repository.existsByRegistrationNumber(user.getRegistrationNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        UserEntity saved = repository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public ResponseEntity<UserEntity> update(long id, UserEntity changes) {
        return repository.findById(id)
                .map(existing -> {
                    if (changes.getName() != null) {
                        existing.setName(changes.getName());
                    }
                    if (changes.getPaternalSurname() != null) {
                        existing.setPaternalSurname(changes.getPaternalSurname());
                    }
                    if (changes.getMaternalSurname() != null) {
                        existing.setMaternalSurname(changes.getMaternalSurname());
                    }
                    if (changes.getEmail() != null) {
                        existing.setEmail(changes.getEmail());
                    }
                    if (changes.getRegistrationNumber() != null) {
                        existing.setRegistrationNumber(changes.getRegistrationNumber());
                    }
                    if (changes.getStatus() != null) {
                        existing.setStatus(changes.getStatus());
                    }
                    if (changes.getPlantel() != null) {
                        existing.setPlantel(changes.getPlantel());
                    }
                    if (changes.getRole() != null) {
                        existing.setRole(changes.getRole());
                    }
                    // Contraseña: sólo si llega no vacía
                    if (changes.getPassword() != null && !changes.getPassword().isBlank()) {
                        existing.setPassword(passwordEncoder.encode(changes.getPassword()));
                    }

                    UserEntity updated = repository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.NOT_FOUND).build()
                );
    }

    public ResponseEntity<Void> delete(long id) {
        return repository.findById(id).map(u -> {
            repository.delete(u);
            return ResponseEntity.noContent().<Void>build();
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

}
