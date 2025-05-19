package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
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
        if (repository.existsByEmail(user.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        if (repository.existsByRegistrationNumber(user.getRegistrationNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        UserEntity saved = repository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public ResponseEntity<UserEntity> update(long id, UserEntity changes) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setName(changes.getName());
                    existing.setPaternalSurname(changes.getPaternalSurname());
                    existing.setMaternalSurname(changes.getMaternalSurname());
                    existing.setEmail(changes.getEmail());
                    existing.setPassword(changes.getPassword());
                    existing.setRegistrationNumber(changes.getRegistrationNumber());
                    existing.setStatus(changes.getStatus());
                    existing.setPlantel(changes.getPlantel());
                    existing.setRole(changes.getRole());
                    UserEntity updated = repository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    public ResponseEntity<Void> delete(long id) {
        return repository.findById(id).map(u -> {
            repository.delete(u);
            return ResponseEntity.noContent().<Void>build();
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

}
