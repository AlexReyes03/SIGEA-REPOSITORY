package com.utez.edu.sigeabackend.modules.media;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "media",
        indexes = { @Index(name = "idx_media_purpose", columnList = "purpose"),
                @Index(name = "idx_media_code",    columnList = "code", unique = true) })
public class MediaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_id")
    private Long id;

    /* ─── hash público que NO expone el id numérico ─── */
    @Column(length = 36, nullable = false, unique = true)
    private String code;

    @Column(name = "file_name", length = 200, nullable = false)
    private String fileName;

    @Column(name = "content_type", length = 100, nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long size;

    @Lob @Basic(fetch = FetchType.LAZY)
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] data;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Purpose purpose;

    @Column(name = "created_at",
            nullable = false,
            updatable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    public enum Purpose { AVATAR, STOCK, CARD }

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    /* getters / setters */
    public Long getId()                { return id; }
    public void setId(Long id)         { this.id = id; }

    public String getCode()            { return code; }
    public void setCode(String code)   { this.code = code; }

    public String getFileName()        { return fileName; }
    public void setFileName(String f)  { this.fileName = f; }

    public String getContentType()     { return contentType; }
    public void setContentType(String c) { this.contentType = c; }

    public Long getSize()              { return size; }
    public void setSize(Long s)        { this.size = s; }

    public byte[] getData()            { return data; }
    public void setData(byte[] d)      { this.data = d; }

    public Purpose getPurpose()        { return purpose; }
    public void setPurpose(Purpose p)  { this.purpose = p; }

    public LocalDateTime getCreatedAt(){ return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
}
