const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/screens/Stocks/StockComponents/StockListManufacturingScreen.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add searchQuery and filteredData
if (!content.includes('const [searchQuery')) {
  const filterLogic = `\n  const [searchQuery, setSearchQuery] = useState("");\n\n  const filteredData = manufactureData.filter((item) =>\n    (item.namemanufacture || "").toLowerCase().includes(searchQuery.toLowerCase()) ||\n    (item.manufactureID || "").toLowerCase().includes(searchQuery.toLowerCase())\n  );\n`;
  content = content.replace(/const \[createManufacture\] = useCreateStockManufactureMutation\(\);/, filterLogic + '\n  const [createManufacture] = useCreateStockManufactureMutation();');
}

// 2. Remove max-w-7xl
content = content.replace(/<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 animate-pageFade">/, '<div className="animate-pageFade">');

// 3. Update action block using regular expressions for robustness
content = content.replace(/action=\{\s*<Button variant="primary" onClick=\{openCreateModal\}>\s*<Plus size=\{18\} className="mr-2" \/>\s*Create\s*<\/Button>\s*\}/, `action={
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
              <Button variant="primary" onClick={openCreateModal}>
                <Plus size={18} className="mr-2" />
                Create
              </Button>
            </div>
          }`);

// 4. Use filteredData
content = content.replace(/manufactureData\.length === 0/g, 'filteredData.length === 0');
content = content.replace(/manufactureData\.map/g, 'filteredData.map');

fs.writeFileSync(filePath, content, 'utf8');
