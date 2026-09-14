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
    technicianName: 'Trần Hoàng Nam (Senior Hardware Technician)',
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
      issueReported: 'Power failure, shutdowns, cracked upper-right display glass, and erratic touch input',
      currentBattery: '87% (Zin Apple)',
      icloudPasscode: 'Password access confirmed',
      simTray: 'Removed and returned to customer',
      trueTone: 'Backup possible',
      sealStatus: 'Two bottom Pentalobe screws retain their Minh Tâm Care seals. No third-party repair found.'
    },
    intakePhotos: [
      {
        title: 'Front',
        subtitle: 'Cracked upper-right corner, erratic touch input',
        tag: 'Front',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDr_GkZDzwoVqXkluXjIMyaDK3NkziLLZ6ea_bLKPjp-3B7CNhqARWwllrTzg6EU1hcdWLXLBrnW5zjqN9gWFCUGPklz4rCLHS9afCs4AAg5-3JMFgs2TTs6SomyXMe4ijIYLdo2HXlVI75PwBZUujWUw0jyRYz4MEc7sf6-P28TXACy83q-3oBhgVn986JBj7BhrJlE8xGOp-0bEkYcKtmRvfvI9urRNv8H9NC8QGu8O8_bLYqlROL'
      },
      {
        title: 'Back and camera assembly',
        subtitle: 'Back glass is clean, camera intact',
        tag: 'Back',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBztxj9N196JM_T2rrwWsieyyBMkEkJ03SVaiZauJ9KWpTdHKDyvtkCZbKSV0o9dZDM8XkTMFWlQSGQSDDUY-UCUchZGIfrL98pOngztoEaj3mb_8uPGN64ZGXsMOjzlX7Fk0oI8SOkGNT763qGOtw1DUsYfeN3Ng56vEgMDO44o4TQ_RB_tN8aa1xwio4_EGCJ_Ya94ilVGyrbyt6U6rtno-99eOSz2s17dhxwsEY3LxEQ7xfSEhbJ'
      },
      {
        title: 'Frame',
        subtitle: 'Light 0.5 mm dent, no warping',
        tag: 'Frame',
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'
      },
      {
        title: 'OLED damage area',
        subtitle: 'Digitizer circuit is damaged',
        tag: 'Error OLED',
        url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&h=300&fit=crop'
      }
    ],
    diagnosis: {
      hardwareDisplay: 'Display glass is cracked at the upper-right corner, with a thin purple line across the OLED panel. Touch input is erratic around keys 7, 8, and 9, with an unresponsive lower strip.',
      powerAndFeatures: 'Boot current is within the 0.12A–0.85A range. Face ID and the original proximity sensor work correctly. Original battery capacity is 87%.',
      proposedSolution: [
        'Replace the iPhone 13 Pro display with an original Apple OLED panel while retaining smooth 120 Hz ProMotion.',
        'Use the dedicated JCID device to restore original display data and preserve True Tone.',
        'Clean the earpiece mesh and reseal the IP68 water- and dust-resistant gasket.',
        'Repair time: 90 minutes after the customer confirms the quoted price.'
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
            name: 'Original iPhone 13 Pro OLED display assembly',
            desc: 'Original pulled part with 120 Hz ProMotion support',
            warranty: '6 months (one-to-one replacement)',
            quantity: 1,
            unitPrice: 2650000,
            totalPrice: 2650000
          },
          {
            stt: '02',
            name: 'Technical installation and True Tone calibration',
            desc: 'Display ROM programming with JCID and pressure testing',
            warranty: 'Device warranty',
            quantity: 1,
            unitPrice: 200000,
            totalPrice: 200000
          },
          {
            stt: '03',
            name: 'Micro-circuit cleaning and IP68 gasket replacement',
            desc: 'Frame maintenance package to restore water resistance',
            warranty: 'Lifetime',
            quantity: 1,
            unitPrice: 150000,
            totalPrice: 0,
            isGift: true
          }
        ],
        subtotal: 2850000,
        discount: 142500,
        finalTotal: 2707500,
        warrantyPolicy: 'Six-month one-for-one touch warranty. Three-month display-color warranty. Not applicable to impact, drops, or liquid damage after handover.'
      }
    ],
    customerFeedback: {
      lastViewedAt: '10:28 - 12 minutes ago',
      openedPlatform: 'Safari Mobile',
      decision: 'pending', // 'pending' | 'approved' | 'rejected'
      decisionAt: null
    },
    timeline: [
      { time: '10:28', title: 'Customer opened the quotation link', note: 'Nguyễn Minh Anh opened the quotation link in Safari Mobile.' },
      { time: '10:20', title: 'Sent quotation v1.0', note: 'Receptionist Linh sent the 2,707,500 VND quotation through ZNS.' },
      { time: '09:45', title: 'Diagnosis completed', note: 'Technician Nam completed board measurements and proposed an original display replacement.' },
      { time: '09:25', title: 'Moved to Bench 04', note: 'The device moved from reception to the technical area for inspection.' },
      { time: '09:10', title: 'Device intake', note: 'Created order RF-20260911-001 and captured four initial condition photos.' }
    ]
  },
  {
    id: 'RF-20260911-004',
    createdAt: '2026-09-11T09:30:00',
    dueDate: '2026-09-12T11:30:00',
    status: 'diagnosing',
    receptionist: 'Linh',
    technicianId: 'ktv-phong',
    technicianName: 'Technician Phong (Preliminary diagnosis and measurements)',
    customer: { id: 'c-02', name: 'Trần Văn Phúc', phone: '0988234567', maskedPhone: '0988***234', isVip: false },
    device: { id: 'd-02', name: 'iPad Pro M1 11"', specs: '256GB · Space Gray', imei: '358901239841209', issueReported: 'Erratic touch input across the lower half of the display' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1850000 }],
    timeline: [{ time: '09:30', title: 'Device intake', note: 'Created an order to inspect the iPad touch cable socket.' }]
  },
  {
    id: 'RF-20260910-019',
    createdAt: '2026-09-10T14:00:00',
    dueDate: '2026-09-11T17:30:00',
    status: 'repairing',
    receptionist: 'Linh',
    technicianId: 'ktv-tuan',
    technicianName: 'Technician Tuấn (Glass and display repair)',
    customer: { id: 'c-03', name: 'Lê Thị Hoa', phone: '0903567890', maskedPhone: '0903***567', isVip: false },
    device: { id: 'd-03', name: 'Galaxy S23 Ultra', specs: '512GB · Botanical Green', imei: '351290384719203', issueReported: 'Replace the charging assembly and original battery' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1950000 }],
    timeline: [{ time: '14:20', title: 'Customer approved quotation', note: 'Started replacing the battery and charging assembly.' }]
  },
  {
    id: 'RF-20260910-012',
    createdAt: '2026-09-10T08:30:00',
    dueDate: '2026-09-10T18:00:00',
    status: 'overdue',
    receptionist: 'Linh',
    technicianId: 'ktv-nam',
    technicianName: 'Technician Nam (Team lead)',
    customer: { id: 'c-04', name: 'Vũ Đình Quân', phone: '0977991234', maskedPhone: '0977***991', isVip: false },
    device: { id: 'd-04', name: 'MacBook Pro 14" M2', specs: 'MagSafe charging failure', imei: 'C02G9014Q05D', issueReported: 'Waiting for the mainboard power IC' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 3400000 }],
    timeline: [{ time: 'Yesterday', title: 'Overdue', note: 'The power IC was delayed by one day; the customer was notified by phone.' }]
  },
  {
    id: 'RF-20260909-008',
    createdAt: '2026-09-09T11:00:00',
    dueDate: '2026-09-11T12:00:00',
    status: 'ready_for_pickup',
    receptionist: 'Linh',
    technicianId: 'ktv-tuan',
    technicianName: 'Technician Tuấn (Glass repair)',
    customer: { id: 'c-05', name: 'Hoàng Bích Ngà', phone: '0934112345', maskedPhone: '0934***112', isVip: false },
    device: { id: 'd-05', name: 'Xiaomi 13 Ultra', specs: 'Ceramic White', imei: '867192038471920', issueReported: 'Curved display glass replacement' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1450000 }],
    timeline: [{ time: '11:15', title: 'QC passed', note: 'SMS sent to notify the customer that the device is ready for pickup.' }]
  },
  {
    id: 'RF-20260908-003',
    createdAt: '2026-09-08T10:00:00',
    dueDate: '2026-09-09T16:00:00',
    status: 'handed_over',
    receptionist: 'Linh',
    technicianId: 'ktv-nam',
    technicianName: 'Technician Nam',
    customer: { id: 'c-06', name: 'Phạm Quốc Tuấn', phone: '0918777888', maskedPhone: '0918***777', isVip: true },
    device: { id: 'd-06', name: 'iPhone 14 Pro Max', specs: '256GB Gold', imei: '357192039485712', issueReported: 'Replace with an original Pisen battery' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1200000 }],
    timeline: [{ time: '09/09', title: 'Device handed over', note: 'Twelve-month warranty activated from 09/09/2026.' }]
  }
];

