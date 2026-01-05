package com.backend.playlocal.service;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.entity.Block;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.BlockRepository;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for blocking users.
 * Implements: DEI P0 - Safety feature for users to block others
 */
@Service
public class BlockService {

    private final BlockRepository blockRepository;
    private final UserRepository userRepository;

    public BlockService(BlockRepository blockRepository, UserRepository userRepository) {
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
    }

    /**
     * Block a user.
     */
    @Transactional
    public void blockUser(UUID blockerId, UUID blockedId, String reason) {
        if (blockerId.equals(blockedId)) {
            throw new IllegalArgumentException("Cannot block yourself");
        }

        User blocker = userRepository.findActiveById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User blocked = userRepository.findActiveById(blockedId)
                .orElseThrow(() -> new ResourceNotFoundException("User to block not found"));

        if (blockRepository.existsBlockBetween(blockerId, blockedId)) {
            throw new DuplicateResourceException("User already blocked");
        }

        Block block = Block.builder()
                .blocker(blocker)
                .blocked(blocked)
                .reason(reason)
                .build();

        blockRepository.save(block);
    }

    /**
     * Unblock a user.
     */
    @Transactional
    public void unblockUser(UUID blockerId, UUID blockedId) {
        Block block = blockRepository.findByBlockerAndBlocked(blockerId, blockedId)
                .orElseThrow(() -> new ResourceNotFoundException("Block not found"));

        blockRepository.delete(block);
    }

    /**
     * Check if a user is blocked.
     */
    public boolean isBlocked(UUID blockerId, UUID blockedId) {
        return blockRepository.existsBlockBetween(blockerId, blockedId);
    }

    /**
     * Get list of blocked user IDs.
     */
    public List<UUID> getBlockedUserIds(UUID userId) {
        return blockRepository.findBlockedUserIds(userId);
    }

    /**
     * Get blocked users with details.
     */
    public List<BlockedUserInfo> getBlockedUsers(UUID userId) {
        return blockRepository.findByBlocker(userId).stream()
                .map(b -> new BlockedUserInfo(
                        b.getBlocked().getUserId(),
                        b.getBlocked().getDisplayName(),
                        b.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public record BlockedUserInfo(UUID userId, String displayName, java.time.Instant blockedAt) {
    }
}
