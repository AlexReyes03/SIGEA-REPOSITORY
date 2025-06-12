package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.CurriculumEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CurriculumDto;
import com.utez.edu.sigeabackend.modules.repositories.CurriculumRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CurriculumService {
    /*
    private final CurriculumRepository curriculumRepo;

    public CurriculumService(CurriculumRepository curriculumRepo) {
        this.curriculumRepo = curriculumRepo;
    }

    public List<CurriculumDto> findByCareerId(Long careerId) {
        List<CurriculumEntity> curriculums = curriculumRepo.findByCareer_Id(careerId);

        return curriculums.stream().map(this::toDto).collect(Collectors.toList());
    }


    private CurriculumDto toDto(CurriculumEntity entity) {
        CurriculumDto dto = new CurriculumDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setModules(
                entity.getModules().stream().map(module -> {
                    CurriculumDto.ModuleDto modDto = new CurriculumDto.ModuleDto();
                    modDto.setId(module.getId());
                    modDto.setName(module.getName());
                    modDto.setSubjects(
                            module.getSubjects().stream().map(subject -> {
                                CurriculumDto.SubjectDto subDto = new CurriculumDto.SubjectDto();
                                subDto.setId(subject.getId());
                                subDto.setName(subject.getName());
                                subDto.setWeeks(subject.getWeeks());
                                subDto.setGrade(subject.getGrade());
                                subDto.setTeacherId(subject.getTeacher() != null ? subject.getTeacher().getId() : null);
                                subDto.setStudentId(subject.getStudentId());
                                return subDto;
                            }).collect(Collectors.toList())
                    );
                    return modDto;
                }).collect(Collectors.toList())
        );
        return dto;
    } */
}
