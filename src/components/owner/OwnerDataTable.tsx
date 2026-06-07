type OwnerDataTableProps<T> = {
  columns: Array<{ key: string; label: string; render: (item: T) => React.ReactNode }>
  rows: T[]
  getRowKey: (item: T) => string
}

export default function OwnerDataTable<T>({ columns, rows, getRowKey }: OwnerDataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e3d4bd] bg-[#fffdf8] shadow-sm">
      <table className="w-full min-w-[820px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#eadcca] bg-[#fff8ef]">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#9f5d36]">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-[#f0e3d2] last:border-b-0">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-middle text-sm font-semibold text-[#4f473e]">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
