package com.utez.edu.sigeabackend.modules.media;

import com.utez.edu.sigeabackend.modules.media.dto.MediaUploadResponseDto;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/sigea/api/media")
public class MediaController {

    private final MediaService service;

    public MediaController(MediaService service) { this.service = service; }

    @PostMapping("/upload/{purpose}")
    public ResponseEntity<MediaUploadResponseDto> upload(
            @PathVariable MediaEntity.Purpose purpose,
            @RequestPart("file") MultipartFile file) throws IOException {

        return ResponseEntity.ok(service.storeAndReturnDto(file, purpose));
    }

    @GetMapping("/raw/{code}")
    public ResponseEntity<byte[]> raw(@PathVariable String code) {
        MediaEntity m = service.getByCode(code);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(m.getContentType()))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS))
                .body(m.getData());
    }
}
