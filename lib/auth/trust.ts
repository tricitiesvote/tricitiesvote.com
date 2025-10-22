import { User } from '@prisma/client';

export function calculateTrustLevel(user: User): {
  maxPendingEdits: number;
  canEdit: boolean;
  trustLevel: 'new' | 'restricted' | 'established' | 'mixed';
} {
  const { editsAccepted, editsRejected, editsPending } = user;
  const totalEdits = editsAccepted + editsRejected;

  // New user - no edits completed yet
  if (totalEdits === 0) {
    return {
      maxPendingEdits: 1,
      canEdit: editsPending === 0, // Can only submit 1 edit, must wait for review
      trustLevel: 'new'
    };
  }

  // After first edit
  if (totalEdits === 1) {
    if (editsAccepted === 1) {
      // First edit accepted - can submit 3 more
      return {
        maxPendingEdits: 3,
        canEdit: editsPending < 3,
        trustLevel: 'established'
      };
    } else {
      // First edit rejected - can submit 1 more
      return {
        maxPendingEdits: 1,
        canEdit: editsPending === 0,
        trustLevel: 'restricted'
      };
    }
  }

  // Established contributor (3+ accepted edits)
  if (editsAccepted >= 3) {
    return {
      maxPendingEdits: 10,
      canEdit: editsPending < 10,
      trustLevel: 'established'
    };
  }

  // Mixed record - limit based on ratio
  const acceptanceRate = editsAccepted / totalEdits;
  if (acceptanceRate >= 0.7) {
    return {
      maxPendingEdits: 3,
      canEdit: editsPending < 3,
      trustLevel: 'mixed'
    };
  } else {
    return {
      maxPendingEdits: 1,
      canEdit: editsPending === 0,
      trustLevel: 'restricted'
    };
  }
}

export async function canUserSubmitEdit(
  user: User,
  entityType: string,
  entityId: string,
  field: string
): Promise<{ canEdit: boolean; reason?: string }> {
  const trustLevel = calculateTrustLevel(user);

  if (!trustLevel.canEdit) {
    return {
      canEdit: false,
      reason: `You have reached your pending edit limit (${trustLevel.maxPendingEdits}). Please wait for your current edits to be reviewed.`
    };
  }

  // TODO: Check if user already has a pending edit for this specific field
  // This would require a database query to check existing edits

  return { canEdit: true };
}