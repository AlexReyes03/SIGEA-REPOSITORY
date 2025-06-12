package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.CreateUserDto;
import com.utez.edu.sigeabackend.modules.entities.dto.UpdateUserDto;
import com.utez.edu.sigeabackend.modules.entities.dto.UserResponseDto;
import com.utez.edu.sigeabackend.modules.media.MediaEntity;
import com.utez.edu.sigeabackend.modules.media.MediaService;
import com.utez.edu.sigeabackend.modules.media.dto.MediaUploadResponseDto;
import com.utez.edu.sigeabackend.modules.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/sigea/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService userService) {
        this.service = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAll() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getById(@PathVariable long id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<UserResponseDto> create(
            @Valid @RequestBody CreateUserDto dto
    ) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> update(
            @PathVariable long id,
            @Valid @RequestBody UpdateUserDto dto
    ) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return service.delete(id);
    }

    @PostMapping("/{userId}/avatar")
    public ResponseEntity<MediaUploadResponseDto> uploadAvatar(
            @PathVariable Long userId,
            @RequestPart("file") MultipartFile file) throws IOException {

        return ResponseEntity.ok(
                service.uploadAvatar(userId, file)
        );
    }
}