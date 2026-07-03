export function EmptyRow({ columns, label }: { columns: number; label: string }) {
  return (
    <tr>
      <td colSpan={columns}>{label}</td>
    </tr>
  );
}
