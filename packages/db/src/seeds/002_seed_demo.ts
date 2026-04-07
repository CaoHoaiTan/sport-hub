import type { Kysely } from 'kysely';
import type { Database } from '../database.js';

/**
 * Comprehensive demo data for all 3 sports.
 * Creates tournaments, teams, players, venues.
 */
export async function seed(db: Kysely<Database>): Promise<void> {
  // Check if demo data exists
  const existing = await db
    .selectFrom('tournaments')
    .select('id')
    .where('name', '=', 'Giải Bóng Đá Mùa Hè 2026')
    .executeTakeFirst();

  if (existing) {
    console.log('Demo data already exists, skipping');
    return;
  }

  // Get organizer IDs
  const org1 = await db.selectFrom('users').select('id').where('email', '=', 'btc.nam@sporthub.vn').executeTakeFirstOrThrow();
  const org2 = await db.selectFrom('users').select('id').where('email', '=', 'btc.linh@sporthub.vn').executeTakeFirstOrThrow();

  // Get team manager IDs
  const managers = await db
    .selectFrom('users')
    .select(['id', 'email'])
    .where('role', '=', 'team_manager')
    .execute();

  const mgr = (email: string) => managers.find((m) => m.email === email)!.id;

  // ═══════════════════════════════════════
  // VENUES
  // ═══════════════════════════════════════
  const venues = await Promise.all([
    db.insertInto('venues').values({
      name: 'Sân vận động Quận 7',
      address: '123 Nguyễn Thị Thập, Phường Tân Phú',
      city: 'TP. Hồ Chí Minh',
      capacity: 5000,
      sport_types: ['football', 'volleyball'],
      surface_type: 'Cỏ nhân tạo',
      amenities: ['Bãi đỗ xe', 'Phòng thay đồ', 'Đèn chiếu sáng', 'Khán đài'],
      created_by: org1.id,
    }).returningAll().executeTakeFirstOrThrow(),
    db.insertInto('venues').values({
      name: 'Nhà thi đấu Phú Thọ',
      address: '1 Lữ Gia, Phường 15, Quận 11',
      city: 'TP. Hồ Chí Minh',
      capacity: 3000,
      sport_types: ['volleyball', 'badminton'],
      surface_type: 'Sàn gỗ',
      amenities: ['Điều hòa', 'Phòng thay đồ', 'Khán đài', 'Wifi'],
      created_by: org1.id,
    }).returningAll().executeTakeFirstOrThrow(),
    db.insertInto('venues').values({
      name: 'CLB Cầu Lông Tân Bình',
      address: '45 Hoàng Hoa Thám, Phường 13, Quận Tân Bình',
      city: 'TP. Hồ Chí Minh',
      capacity: 200,
      sport_types: ['badminton'],
      surface_type: 'Sàn nhựa PVC',
      amenities: ['Đèn chiếu sáng', 'Phòng thay đồ', 'Căng tin'],
      created_by: org2.id,
    }).returningAll().executeTakeFirstOrThrow(),
  ]);

  console.log(`Seeded ${venues.length} venues`);

  // ═══════════════════════════════════════
  // FOOTBALL TOURNAMENT — Round Robin
  // ═══════════════════════════════════════
  const footballTournament = await db.insertInto('tournaments').values({
    name: 'Giải Bóng Đá Mùa Hè 2026',
    slug: 'giai-bong-da-mua-he-2026',
    description: 'Giải bóng đá 5 người dành cho các câu lạc bộ nghiệp dư tại TP.HCM. Thi đấu theo thể thức vòng tròn, đội có nhiều điểm nhất sẽ vô địch.',
    sport: 'football',
    format: 'round_robin',
    status: 'in_progress',
    organizer_id: org1.id,
    max_teams: 6,
    min_players_per_team: 5,
    max_players_per_team: 11,
    registration_start: new Date('2026-03-01'),
    registration_end: new Date('2026-03-31'),
    start_date: new Date('2026-04-05'),
    end_date: new Date('2026-05-30'),
    points_for_win: 3,
    points_for_draw: 1,
    points_for_loss: 0,
    entry_fee: 500000,
    rules_text: JSON.stringify({
      matchDuration: 50,
      halfCount: 2,
      hasExtraTime: false,
      hasPenalty: false,
    }),
  }).returningAll().executeTakeFirstOrThrow();

  const footballTeams = [
    { name: 'FC Phượng Hoàng', manager: mgr('ql.hung@sporthub.vn') },
    { name: 'CLB Sao Vàng', manager: mgr('ql.thao@sporthub.vn') },
    { name: 'Đội Rồng Xanh', manager: mgr('ql.duc@sporthub.vn') },
    { name: 'FC Đại Bàng', manager: mgr('ql.mai@sporthub.vn') },
  ];

  const fbTeamIds: string[] = [];
  for (const t of footballTeams) {
    const team = await db.insertInto('teams').values({
      tournament_id: footballTournament.id,
      name: t.name,
      manager_id: t.manager,
    }).returningAll().executeTakeFirstOrThrow();
    fbTeamIds.push(team.id);
  }

  // Add players for each football team
  const footballPositions = ['goalkeeper', 'defender', 'defender', 'midfielder', 'midfielder', 'forward', 'forward'];
  const footballNames = [
    ['Trần Văn Hùng', 'Lê Quốc Anh', 'Nguyễn Hoàng Nam', 'Phạm Minh Đức', 'Võ Thanh Tùng', 'Hoàng Văn Phong', 'Bùi Đình Trọng'],
    ['Đặng Văn Lâm', 'Đỗ Hùng Dũng', 'Nguyễn Tuấn Anh', 'Lương Xuân Trường', 'Phan Văn Đức', 'Nguyễn Tiến Linh', 'Hà Đức Chinh'],
    ['Trần Đình Trọng', 'Quế Ngọc Hải', 'Nguyễn Văn Toàn', 'Triệu Việt Hưng', 'Nguyễn Phong Hồng Duy', 'Nguyễn Văn Quyết', 'Vũ Minh Tuấn'],
    ['Bùi Tiến Dũng', 'Nguyễn Thành Chung', 'Đoàn Văn Hậu', 'Nguyễn Quang Hải', 'Nguyễn Công Phượng', 'Hồ Tấn Tài', 'Trần Minh Vương'],
  ];

  for (let ti = 0; ti < fbTeamIds.length; ti++) {
    for (let pi = 0; pi < footballNames[ti].length; pi++) {
      await db.insertInto('team_players').values({
        team_id: fbTeamIds[ti],
        full_name: footballNames[ti][pi],
        jersey_number: pi === 0 ? 1 : (pi + 1) * 3,
        position: footballPositions[pi],
        is_captain: pi === 4,
      }).execute();
    }
  }

  // Generate round-robin matches for football (4 teams = 6 matches)
  const fbMatchups = [
    [0, 1], [2, 3], // Round 1
    [0, 2], [1, 3], // Round 2
    [0, 3], [1, 2], // Round 3
  ];

  const baseDate = new Date('2026-04-05T15:00:00+07:00');
  for (let i = 0; i < fbMatchups.length; i++) {
    const [home, away] = fbMatchups[i];
    const round = Math.floor(i / 2) + 1;
    const matchDate = new Date(baseDate);
    matchDate.setDate(matchDate.getDate() + (round - 1) * 7); // 1 week apart
    if (i % 2 === 1) matchDate.setHours(matchDate.getHours() + 2); // 2nd match 2h later

    await db.insertInto('matches').values({
      tournament_id: footballTournament.id,
      home_team_id: fbTeamIds[home],
      away_team_id: fbTeamIds[away],
      round,
      round_name: `Vòng ${round}`,
      venue_id: venues[0].id,
      scheduled_at: matchDate,
      status: i < 2 ? 'completed' : 'scheduled',
      home_score: i === 0 ? 2 : i === 1 ? 1 : null,
      away_score: i === 0 ? 1 : i === 1 ? 1 : null,
      winner_team_id: i === 0 ? fbTeamIds[home] : null,
      is_draw: i === 1 ? true : null,
    }).execute();
  }

  // Add standings for completed matches
  const fbStandings = [
    // Team A: W1 D0 L0 = 3pts, GF2 GA1
    { teamIdx: 0, played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 1, pts: 3 },
    // Team B: W0 D0 L1 = 0pts, GF1 GA2
    { teamIdx: 1, played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 2, pts: 0 },
    // Team C: W0 D1 L0 = 1pt, GF1 GA1
    { teamIdx: 2, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, pts: 1 },
    // Team D: W0 D1 L0 = 1pt, GF1 GA1
    { teamIdx: 3, played: 1, won: 0, drawn: 1, lost: 0, gf: 1, ga: 1, pts: 1 },
  ];

  for (let i = 0; i < fbStandings.length; i++) {
    const s = fbStandings[i];
    await db.insertInto('standings').values({
      tournament_id: footballTournament.id,
      team_id: fbTeamIds[s.teamIdx],
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goals_for: s.gf,
      goals_against: s.ga,
      goal_difference: s.gf - s.ga,
      points: s.pts,
      rank: i + 1,
    }).execute();
  }

  console.log('Seeded Football tournament with 4 teams, 28 players, 6 matches, standings');

  // ═══════════════════════════════════════
  // VOLLEYBALL TOURNAMENT — Single Elimination
  // ═══════════════════════════════════════
  const volleyballTournament = await db.insertInto('tournaments').values({
    name: 'Giải Bóng Chuyền Liên Quận 2026',
    slug: 'giai-bong-chuyen-lien-quan-2026',
    description: 'Giải bóng chuyền nam dành cho các quận huyện tại TP.HCM. Thi đấu loại trực tiếp, best-of-5 set.',
    sport: 'volleyball',
    format: 'single_elimination',
    status: 'registration',
    organizer_id: org1.id,
    max_teams: 8,
    min_players_per_team: 6,
    max_players_per_team: 14,
    registration_start: new Date('2026-03-15'),
    registration_end: new Date('2026-04-15'),
    start_date: new Date('2026-04-20'),
    end_date: new Date('2026-06-01'),
    points_for_win: 3,
    points_for_draw: 0,
    points_for_loss: 0,
    entry_fee: 300000,
    rules_text: JSON.stringify({
      volleyballCategory: 'men',
      setsToWin: 3,
      pointsPerSet: 25,
      finalSetPoints: 15,
    }),
  }).returningAll().executeTakeFirstOrThrow();

  const volleyTeams = [
    { name: 'Bóng Chuyền Quận 1', manager: mgr('ql.hung@sporthub.vn') },
    { name: 'Bóng Chuyền Quận 3', manager: mgr('ql.thao@sporthub.vn') },
    { name: 'Bóng Chuyền Quận 7', manager: mgr('ql.duc@sporthub.vn') },
    { name: 'Bóng Chuyền Thủ Đức', manager: mgr('ql.mai@sporthub.vn') },
  ];

  const vbTeamIds: string[] = [];
  for (const t of volleyTeams) {
    const team = await db.insertInto('teams').values({
      tournament_id: volleyballTournament.id,
      name: t.name,
      manager_id: t.manager,
    }).returningAll().executeTakeFirstOrThrow();
    vbTeamIds.push(team.id);
  }

  const volleyPositions = ['setter', 'libero', 'outside_hitter', 'outside_hitter', 'middle_blocker', 'opposite'];
  const volleyNames = [
    ['Nguyễn Văn Hiếu', 'Trần Đức Minh', 'Lê Hoàng Long', 'Phạm Tấn Đạt', 'Võ Minh Quân', 'Bùi Đức Thắng'],
    ['Hoàng Văn Bảo', 'Đặng Quốc Khánh', 'Ngô Văn Phú', 'Lý Hoàng An', 'Trương Minh Nhật', 'Huỳnh Văn Tín'],
    ['Đinh Văn Khoa', 'Dương Quốc Huy', 'Phan Văn Sơn', 'Mai Xuân Hòa', 'Tạ Minh Phát', 'Lâm Quốc Vương'],
    ['Cao Văn Đại', 'Châu Quốc Bảo', 'Trịnh Minh Hiệp', 'Vương Đức Toàn', 'Đỗ Hoàng Sơn', 'Hồ Văn Nghĩa'],
  ];

  for (let ti = 0; ti < vbTeamIds.length; ti++) {
    for (let pi = 0; pi < volleyNames[ti].length; pi++) {
      await db.insertInto('team_players').values({
        team_id: vbTeamIds[ti],
        full_name: volleyNames[ti][pi],
        jersey_number: pi + 1,
        position: volleyPositions[pi],
        is_captain: pi === 0,
      }).execute();
    }
  }

  console.log('Seeded Volleyball tournament with 4 teams, 24 players');

  // ═══════════════════════════════════════
  // BADMINTON TOURNAMENT — Single Elimination
  // ═══════════════════════════════════════
  const badmintonTournament = await db.insertInto('tournaments').values({
    name: 'Giải Cầu Lông Đôi Nam Nữ 2026',
    slug: 'giai-cau-long-doi-nam-nu-2026',
    description: 'Giải cầu lông đôi nam nữ (mixed doubles), thi đấu loại trực tiếp. Best-of-3 set, 21 điểm/set.',
    sport: 'badminton',
    format: 'single_elimination',
    status: 'registration',
    organizer_id: org2.id,
    max_teams: 8,
    min_players_per_team: 2,
    max_players_per_team: 2,
    registration_start: new Date('2026-03-20'),
    registration_end: new Date('2026-04-20'),
    start_date: new Date('2026-04-25'),
    end_date: new Date('2026-05-15'),
    points_for_win: 1,
    points_for_draw: 0,
    points_for_loss: 0,
    entry_fee: 200000,
    rules_text: JSON.stringify({
      badmintonCategory: 'mixed_doubles',
      setsToWin: 2,
      pointsPerSet: 21,
      maxPoints: 30,
    }),
  }).returningAll().executeTakeFirstOrThrow();

  const badmintonTeams = [
    { name: 'Cặp Đôi Hoàn Hảo', manager: mgr('ql.tuan@sporthub.vn') },
    { name: 'Smash & Dash', manager: mgr('ql.hoa@sporthub.vn') },
    { name: 'Shuttle Stars', manager: mgr('ql.hung@sporthub.vn') },
    { name: 'Cầu Lông Phú Nhuận', manager: mgr('ql.thao@sporthub.vn') },
  ];

  const bmTeamIds: string[] = [];
  for (const t of badmintonTeams) {
    const team = await db.insertInto('teams').values({
      tournament_id: badmintonTournament.id,
      name: t.name,
      manager_id: t.manager,
    }).returningAll().executeTakeFirstOrThrow();
    bmTeamIds.push(team.id);
  }

  const badmintonPairs = [
    ['Nguyễn Tiến Minh', 'Thùy Linh'],
    ['Đức Phát', 'Vũ Thị Trang'],
    ['Hải Đăng', 'Ngọc Huyền'],
    ['Minh Tú', 'Phương Anh'],
  ];

  for (let ti = 0; ti < bmTeamIds.length; ti++) {
    for (let pi = 0; pi < badmintonPairs[ti].length; pi++) {
      await db.insertInto('team_players').values({
        team_id: bmTeamIds[ti],
        full_name: badmintonPairs[ti][pi],
        jersey_number: pi + 1,
        position: 'doubles',
        is_captain: pi === 0,
      }).execute();
    }
  }

  console.log('Seeded Badminton tournament with 4 teams, 8 players');

  // ═══════════════════════════════════════
  // TOURNAMENT POSTS
  // ═══════════════════════════════════════
  await db.insertInto('tournament_posts').values({
    tournament_id: footballTournament.id,
    author_id: org1.id,
    title: 'Thông báo khai mạc giải đấu',
    content: 'Giải Bóng Đá Mùa Hè 2026 chính thức khai mạc vào ngày 05/04/2026 tại Sân vận động Quận 7. Tất cả các đội vui lòng có mặt lúc 7h30 sáng để làm thủ tục.',
    is_pinned: true,
  }).execute();

  await db.insertInto('tournament_posts').values({
    tournament_id: footballTournament.id,
    author_id: org1.id,
    title: 'Lịch thi đấu vòng 1',
    content: 'Vòng 1 sẽ diễn ra từ ngày 05/04 đến 12/04. Mỗi đội thi đấu 1 trận/tuần. Lịch chi tiết xem tại tab Lịch thi đấu.',
    is_pinned: false,
  }).execute();

  await db.insertInto('tournament_posts').values({
    tournament_id: volleyballTournament.id,
    author_id: org1.id,
    title: 'Mở đăng ký Giải Bóng Chuyền Liên Quận',
    content: 'Giải Bóng Chuyền Liên Quận 2026 đã mở đăng ký! Các đội đăng ký trước 15/04/2026. Lệ phí: 300.000 VNĐ/đội.',
    is_pinned: true,
  }).execute();

  await db.insertInto('tournament_posts').values({
    tournament_id: badmintonTournament.id,
    author_id: org2.id,
    title: 'Giải Cầu Lông Đôi Nam Nữ — Đăng ký ngay!',
    content: 'Giải cầu lông dành cho các cặp đôi nam nữ. Thi đấu loại trực tiếp, best-of-3, 21 điểm/set. Đăng ký hạn chót: 20/04/2026.',
    is_pinned: true,
  }).execute();

  console.log('Seeded tournament posts');

  // ═══════════════════════════════════════
  // PAYMENT PLANS
  // ═══════════════════════════════════════
  await db.insertInto('payment_plans').values({
    tournament_id: footballTournament.id,
    name: 'Lệ phí tham gia',
    amount: 500000,
    currency: 'VND',
    per_team: true,
  }).execute();

  await db.insertInto('payment_plans').values({
    tournament_id: volleyballTournament.id,
    name: 'Lệ phí tham gia',
    amount: 300000,
    currency: 'VND',
    per_team: true,
  }).execute();

  await db.insertInto('payment_plans').values({
    tournament_id: badmintonTournament.id,
    name: 'Lệ phí tham gia',
    amount: 200000,
    currency: 'VND',
    per_team: true,
    early_bird_amount: 150000,
    early_bird_deadline: new Date('2026-04-10'),
  }).execute();

  console.log('Seeded payment plans');
  console.log('Demo data seeded successfully!');
}
