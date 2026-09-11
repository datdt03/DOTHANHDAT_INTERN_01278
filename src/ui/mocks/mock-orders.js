/**
 * Centralized Mock Orders Data
 */

export const INITIAL_ORDERS = [
  {
    id: 'RF-20260911-001',
    createdAt: '2026-09-11T09:10:00',
    dueDate: '2026-09-13T17:30:00',
    status: 'waiting_for_approval',
    receptionist: 'Linh',
    technicianId: 'ktv-nam',
    technicianName: 'Trần Hoàng Nam (KTV Trưởng Phần Cứng Bậc 3)',
    customer: {
      id: 'c-01',
      name: 'Nguyễn Minh Anh',
      phone: '0912849888',
      maskedPhone: '0912***888',
      isVip: true,
      vipDiscountRate: 0.05
    },
    device: {
      id: 'd-01',
      name: 'iPhone 13 Pro',
      specs: '128GB · Xanh Sierra',
      imei: '356891104829104',
      issueReported: 'Lỗi nguồn, sập nguồn, nứt kính màn hình góc trên phải, loạn cảm ứng',
      currentBattery: '87% (Zin Apple)',
      icloudPasscode: 'Đã mở mật khẩu',
      simTray: 'Đã tháo trả khách',
      trueTone: 'Có thể sao lưu',
      sealStatus: '2 ốc đáy hình sao Pentalobe còn nguyên tem Minh Tâm Care. Chưa qua sửa chữa bên ngoài.'
    },
    intakePhotos: [
      {
        title: 'Mặt trước',
        subtitle: 'Nứt góc trên phải, loạn cảm ứng',
        tag: 'Mặt trước',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDr_GkZDzwoVqXkluXjIMyaDK3NkziLLZ6ea_bLKPjp-3B7CNhqARWwllrTzg6EU1hcdWLXLBrnW5zjqN9gWFCUGPklz4rCLHS9afCs4AAg5-3JMFgs2TTs6SomyXMe4ijIYLdo2HXlVI75PwBZUujWUw0jyRYz4MEc7sf6-P28TXACy83q-3oBhgVn986JBj7BhrJlE8xGOp-0bEkYcKtmRvfvI9urRNv8H9NC8QGu8O8_bLYqlROL'
      },
      {
        title: 'Mặt sau & Cụm Cam',
        subtitle: 'Kính lưng đẹp, camera nguyên vẹn',
        tag: 'Mặt sau',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBztxj9N196JM_T2rrwWsieyyBMkEkJ03SVaiZauJ9KWpTdHKDyvtkCZbKSV0o9dZDM8XkTMFWlQSGQSDDUY-UCUchZGIfrL98pOngztoEaj3mb_8uPGN64ZGXsMOjzlX7Fk0oI8SOkGNT763qGOtw1DUsYfeN3Ng56vEgMDO44o4TQ_RB_tN8aa1xwio4_EGCJ_Ya94ilVGyrbyt6U6rtno-99eOSz2s17dhxwsEY3LxEQ7xfSEhbJ'
      },
      {
        title: 'Khung sườn',
        subtitle: 'Cấn nhẹ 0.5mm, không cong vênh',
        tag: 'Khung sườn',
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'
      },
      {
        title: 'Vùng chấn thương OLED',
        subtitle: 'Đứt mạch số hóa Digitizer',
        tag: 'Lỗi OLED',
        url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&h=300&fit=crop'
      }
    ],
    diagnosis: {
      hardwareDisplay: 'Màn hình vỡ góc trên phải, xuất hiện sọc tím mảnh dọc panel OLED. Cảm ứng nhảy loạn khu vực phím 7, 8, 9 và đơ dải phím dưới.',
      powerAndFeatures: 'Dòng cấp nguồn Boot current chuẩn 0.12A ~ 0.85A. Cụm Face ID, cảm biến tiệm cận nguyên bản hoạt động tốt. Pin zin 87% dung lượng.',
      proposedSolution: [
        'Thay Màn hình iPhone 13 Pro OLED Zin Apple (giữ nguyên ProMotion 120Hz mượt mà).',
        'Dùng thiết bị chuyên dụng JCID nạp lại dữ liệu màn gốc, bảo toàn tính năng True Tone.',
        'Vệ sinh màng loa thoại, ép lại ron cao su chống nước & bụi chuẩn IP68.',
        'Thời gian thi công: 90 phút ngay khi khách hàng xác nhận duyệt giá.'
      ],
      checkedItemsCount: 14
    },
    quoteVersion: 'v1.0',
    quoteVersions: [
      {
        version: 'v1.0',
        createdAt: '2026-09-11T10:20:00',
        status: 'published',
        items: [
          {
            stt: '01',
            name: 'Cụm Màn hình iPhone 13 Pro OLED Zin Apple',
            desc: 'Linh kiện bóc máy nguyên bản, hỗ trợ ProMotion 120Hz',
            warranty: '6 tháng (1 đổi 1)',
            quantity: 1,
            unitPrice: 2650000,
            totalPrice: 2650000
          },
          {
            stt: '02',
            name: 'Công tháo lắp kỹ thuật & Đồng bộ True Tone',
            desc: 'Nạp ROM hiển thị qua máy JCID, test áp suất',
            warranty: 'Theo máy',
            quantity: 1,
            unitPrice: 200000,
            totalPrice: 200000
          },
          {
            stt: '03',
            name: 'Vệ sinh vi mạch & Thay ron chống nước IP68',
            desc: 'Gói bảo dưỡng viền khung phục hồi chống nước',
            warranty: 'Trọn đời',
            quantity: 1,
            unitPrice: 150000,
            totalPrice: 0,
            isGift: true
          }
        ],
        subtotal: 2850000,
        discount: 142500,
        finalTotal: 2707500,
        warrantyPolicy: 'Bảo hành cảm ứng 06 tháng (1 đổi 1). Bảo hành hiển thị màu sắc 03 tháng. Không áp dụng trong trường hợp rơi vỡ va đập hoặc nước vào sau bàn giao.'
      }
    ],
    customerFeedback: {
      lastViewedAt: '10:28 - 12 phút trước',
      openedPlatform: 'Safari Mobile',
      decision: 'pending', // 'pending' | 'approved' | 'rejected'
      decisionAt: null
    },
    timeline: [
      { time: '10:28', title: 'Khách mở xem link báo giá', note: 'Nguyễn Minh Anh mở link báo giá trên Safari Mobile.' },
      { time: '10:20', title: 'Gửi báo giá v1.0', note: 'Lễ tân Linh phát hành báo giá 2.707.500 đ qua tin nhắn ZNS.' },
      { time: '09:45', title: 'Hoàn tất chẩn đoán', note: 'KTV Nam hoàn thành đo đạc bo mạch, đề xuất thay màn Zin.' },
      { time: '09:25', title: 'Chuyển sang Bàn 04', note: 'Máy được chuyển từ quầy tiếp tân vào khu kỹ thuật kiểm tra.' },
      { time: '09:10', title: 'Tiếp nhận máy', note: 'Lập phiếu RF-20260911-001, chụp 4 ảnh hiện trạng ban đầu.' }
    ]
  },
  {
    id: 'RF-20260911-004',
    createdAt: '2026-09-11T09:30:00',
    dueDate: '2026-09-12T11:30:00',
    status: 'diagnosing',
    receptionist: 'Linh',
    technicianId: 'ktv-phong',
    technicianName: 'KTV Phong (Chẩn đoán sơ bộ & đo đạc)',
    customer: { id: 'c-02', name: 'Trần Văn Phúc', phone: '0988234567', maskedPhone: '0988***234', isVip: false },
    device: { id: 'd-02', name: 'iPad Pro M1 11"', specs: '256GB · Xám Không Gian', imei: '358901239841209', issueReported: 'Loạn cảm ứng nửa dưới màn hình' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1850000 }],
    timeline: [{ time: '09:30', title: 'Tiếp nhận máy', note: 'Lập phiếu kiểm tra socket cáp cảm ứng iPad.' }]
  },
  {
    id: 'RF-20260910-019',
    createdAt: '2026-09-10T14:00:00',
    dueDate: '2026-09-11T17:30:00',
    status: 'repairing',
    receptionist: 'Linh',
    technicianId: 'ktv-tuan',
    technicianName: 'KTV Tuấn (Ép kính & Màn hình)',
    customer: { id: 'c-03', name: 'Lê Thị Hoa', phone: '0903567890', maskedPhone: '0903***567', isVip: false },
    device: { id: 'd-03', name: 'Galaxy S23 Ultra', specs: '512GB · Xanh Botanic', imei: '351290384719203', issueReported: 'Thay cụm sạc & pin zin' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1950000 }],
    timeline: [{ time: '14:20', title: 'Khách duyệt báo giá', note: 'Bắt đầu tiến hành thay pin và cụm sạc.' }]
  },
  {
    id: 'RF-20260910-012',
    createdAt: '2026-09-10T08:30:00',
    dueDate: '2026-09-10T18:00:00',
    status: 'overdue',
    receptionist: 'Linh',
    technicianId: 'ktv-nam',
    technicianName: 'KTV Nam (Trưởng nhóm)',
    customer: { id: 'c-04', name: 'Vũ Đình Quân', phone: '0977991234', maskedPhone: '0977***991', isVip: false },
    device: { id: 'd-04', name: 'MacBook Pro 14" M2', specs: 'Mất nguồn sạc MagSafe', imei: 'C02G9014Q05D', issueReported: 'Chờ IC nguồn mainboard' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 3400000 }],
    timeline: [{ time: 'Hôm qua', title: 'Trễ hẹn', note: 'IC nguồn từ hãng về trễ 1 ngày, đã gọi thông báo cho khách.' }]
  },
  {
    id: 'RF-20260909-008',
    createdAt: '2026-09-09T11:00:00',
    dueDate: '2026-09-11T12:00:00',
    status: 'ready_for_pickup',
    receptionist: 'Linh',
    technicianId: 'ktv-tuan',
    technicianName: 'KTV Tuấn (Ép kính)',
    customer: { id: 'c-05', name: 'Hoàng Bích Ngà', phone: '0934112345', maskedPhone: '0934***112', isVip: false },
    device: { id: 'd-05', name: 'Xiaomi 13 Ultra', specs: 'Màu Trắng Gốm', imei: '867192038471920', issueReported: 'Ép kính màn hình cong' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1450000 }],
    timeline: [{ time: '11:15', title: 'Kiểm tra QC Đạt', note: 'Đã gửi SMS thông báo khách đến nhận máy.' }]
  },
  {
    id: 'RF-20260908-003',
    createdAt: '2026-09-08T10:00:00',
    dueDate: '2026-09-09T16:00:00',
    status: 'handed_over',
    receptionist: 'Linh',
    technicianId: 'ktv-nam',
    technicianName: 'KTV Nam',
    customer: { id: 'c-06', name: 'Phạm Quốc Tuấn', phone: '0918777888', maskedPhone: '0918***777', isVip: true },
    device: { id: 'd-06', name: 'iPhone 14 Pro Max', specs: '256GB Vàng Gold', imei: '357192039485712', issueReported: 'Thay pin Pisen chính hãng' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1200000 }],
    timeline: [{ time: '09/09', title: 'Đã bàn giao máy', note: 'Bảo hành 12 tháng kích hoạt từ ngày 09/09/2026.' }]
  }
];
