import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeTrumbo() {
  console.log('Starting Trumbo merge process...\n');
  
  // Get both Trumbo candidates
  const johnHTrumbo = await prisma.candidate.findFirst({
    where: {
      id: 'cmdje1aei0013vovmadmwtq45',
      name: 'John H Trumbo'
    },
    include: {
      contributions: true,
      endorsements: true,
      races: true
    }
  });

  const johnTrumbo = await prisma.candidate.findFirst({
    where: {
      id: 'cmdjgtt9h000nvovnek88m305',
      name: 'John Trumbo'
    },
    include: {
      contributions: true,
      endorsements: true,
      races: true
    }
  });

  if (!johnHTrumbo || !johnTrumbo) {
    console.log('Could not find one or both Trumbo candidates');
    return;
  }

  console.log('Found both candidates:');
  console.log(`1. ${johnHTrumbo.name} (ID: ${johnHTrumbo.id})`);
  console.log(`   - Contributions: ${johnHTrumbo.contributions.length}`);
  console.log(`   - Endorsements: ${johnHTrumbo.endorsements.length}`);
  console.log(`   - Races: ${johnHTrumbo.races.length}`);
  
  console.log(`\n2. ${johnTrumbo.name} (ID: ${johnTrumbo.id})`);
  console.log(`   - Contributions: ${johnTrumbo.contributions.length}`);
  console.log(`   - Endorsements: ${johnTrumbo.endorsements.length}`);
  console.log(`   - Races: ${johnTrumbo.races.length}`);

  // The plan: Keep John Trumbo (in Ward District #3) and move contributions from John H Trumbo
  console.log('\nMerge plan:');
  console.log(`- Keep: ${johnTrumbo.name} (ID: ${johnTrumbo.id}) in City Council Ward District #3`);
  console.log(`- Delete: ${johnHTrumbo.name} (ID: ${johnHTrumbo.id}) from generic Kennewick City Council`);
  console.log(`- Move ${johnHTrumbo.contributions.length} contributions to the kept candidate`);

  console.log('\nProceed with merge? (Comment out the return below to execute)');
  return; // Safety check - comment this out to actually run the merge

  // Start transaction
  await prisma.$transaction(async (tx) => {
    // 1. Move contributions from John H Trumbo to John Trumbo
    if (johnHTrumbo.contributions.length > 0) {
      await tx.contribution.updateMany({
        where: {
          candidateId: johnHTrumbo.id
        },
        data: {
          candidateId: johnTrumbo.id
        }
      });
      console.log(`Moved ${johnHTrumbo.contributions.length} contributions`);
    }

    // 2. Move endorsements if any
    if (johnHTrumbo.endorsements.length > 0) {
      await tx.endorsement.updateMany({
        where: {
          candidateId: johnHTrumbo.id
        },
        data: {
          candidateId: johnTrumbo.id
        }
      });
      console.log(`Moved ${johnHTrumbo.endorsements.length} endorsements`);
    }

    // 3. Delete the CandidateRace entries for John H Trumbo
    await tx.candidateRace.deleteMany({
      where: {
        candidateId: johnHTrumbo.id
      }
    });
    console.log('Deleted CandidateRace entries');

    // 4. Update John Trumbo with any missing information from John H Trumbo
    const updateData: any = {};
    
    // Preserve the fuller name
    updateData.name = 'John H Trumbo';
    
    // Copy over any fields that might be filled in John H Trumbo but not John Trumbo
    if (johnHTrumbo.image && !johnTrumbo.image) updateData.image = johnHTrumbo.image;
    if (johnHTrumbo.bio && !johnTrumbo.bio) updateData.bio = johnHTrumbo.bio;
    if (johnHTrumbo.statement && !johnTrumbo.statement) updateData.statement = johnHTrumbo.statement;
    if (johnHTrumbo.email && !johnTrumbo.email) updateData.email = johnHTrumbo.email;
    if (johnHTrumbo.phone && !johnTrumbo.phone) updateData.phone = johnHTrumbo.phone;
    if (johnHTrumbo.website && !johnTrumbo.website) updateData.website = johnHTrumbo.website;
    if (johnHTrumbo.facebook && !johnTrumbo.facebook) updateData.facebook = johnHTrumbo.facebook;
    if (johnHTrumbo.twitter && !johnTrumbo.twitter) updateData.twitter = johnHTrumbo.twitter;
    if (johnHTrumbo.instagram && !johnTrumbo.instagram) updateData.instagram = johnHTrumbo.instagram;
    if (johnHTrumbo.youtube && !johnTrumbo.youtube) updateData.youtube = johnHTrumbo.youtube;
    if (johnHTrumbo.pdc && !johnTrumbo.pdc) updateData.pdc = johnHTrumbo.pdc;

    await tx.candidate.update({
      where: {
        id: johnTrumbo.id
      },
      data: updateData
    });
    console.log('Updated candidate information');

    // 5. Delete John H Trumbo
    await tx.candidate.delete({
      where: {
        id: johnHTrumbo.id
      }
    });
    console.log('Deleted duplicate candidate');
  });

  console.log('\nMerge completed successfully!');
  
  // Verify the result
  const mergedCandidate = await prisma.candidate.findUnique({
    where: {
      id: johnTrumbo.id
    },
    include: {
      contributions: {
        select: {
          amount: true
        }
      },
      races: {
        include: {
          race: {
            include: {
              office: true
            }
          }
        }
      }
    }
  });

  if (mergedCandidate) {
    console.log('\nFinal result:');
    console.log(`Name: ${mergedCandidate.name}`);
    console.log(`Contributions: ${mergedCandidate.contributions.length} (Total: $${mergedCandidate.contributions.reduce((sum, c) => sum + c.amount, 0).toFixed(2)})`);
    console.log(`Race: ${mergedCandidate.races[0]?.race.office.title || 'No race'}`);
  }

  await prisma.$disconnect();
}

mergeTrumbo().catch(console.error);