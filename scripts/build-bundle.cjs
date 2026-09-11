const fs = require('fs');

const files = [
  'src/ui/config/routes.js',
  'src/ui/config/ui.config.js',
  'src/ui/mocks/mock-orders.js',
  'src/ui/mocks/ui-data.js',
  'src/ui/mocks/mock-api.js',
  'src/ui/shared/utils/format.js',
  'src/ui/shared/utils/dom.js',
  'src/ui/shared/components/badge.js',
  'src/ui/shared/components/toast.js',
  'src/ui/shared/components/modal.js',
  'src/ui/features/dashboard/render-table.js',
  'src/ui/features/dashboard/dashboard-render.js',
  'src/ui/features/dashboard/dashboard-actions.js',
  'src/ui/features/dashboard/dashboard.js',
  'src/ui/features/repair-order-detail/render-header.js',
  'src/ui/features/repair-order-detail/render-condition.js',
  'src/ui/features/repair-order-detail/render-quote.js',
  'src/ui/features/repair-order-detail/render-sidebar.js',
  'src/ui/features/repair-order-detail/detail-actions.js',
  'src/ui/features/repair-order-detail/repair-order-detail.js',
  'src/ui/features/customer-link/customer-render-quote.js',
  'src/ui/features/customer-link/customer-render.js',
  'src/ui/features/customer-link/customer-actions.js',
  'src/ui/features/customer-link/customer-link.js',
  'src/ui/app.js'
];

let bundleCode = '(function() {\n"use strict";\n\n';

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // strip imports
  content = content.replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?\r?\n?/gm, '');
  // strip re-exports like export { foo } from '...'
  content = content.replace(/^export\s+\{[\s\S]*?\}\s*from\s+['"].*?['"];?\r?\n?/gm, '');
  // strip named exports like export { foo, bar };
  content = content.replace(/^export\s+\{[\s\S]*?\};?\r?\n?/gm, '');
  // strip export from declarations
  content = content.replace(/^export\s+(async\s+function|function|const|let|var)\s+/gm, '$1 ');
  content = content.replace(/^export\s+default\s+/gm, '');
  bundleCode += `// --- ${file} ---\n` + content + '\n\n';
}

bundleCode += '})();\n';

fs.writeFileSync('src/ui/app.bundle.js', bundleCode);
console.log('Successfully generated src/ui/app.bundle.js');
