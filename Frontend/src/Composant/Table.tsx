// @ts-nocheck
const Table = ({ columns, data, actions, emptyMessage = "Aucune donnée trouvée", startIndex = 0 }) => {
  return (
    <table className="w-full border-collapse w-full border-collapse-hover mb-0">
      <thead className="thead-light">
        <tr>
          <th style={{ width: "7px" }}>#</th>
          {columns.map((col, index) => (
            <th key={index}>{col.label}</th>
          ))}
          {actions && <th style={{ width: "100px" }}>Action</th>}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (actions ? 2 : 1)} className="text-center">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, index) => (
            <tr key={row.id || index}>
              <td>{startIndex + index + 1}</td>
              {columns.map((col, i) => (
                <td key={i}>
                  {typeof col.render === "function"
                    ? col.render(row)
                    : col.key.split('.').reduce((o, k) => (o || {})[k], row)} {/* Gestion des clés imbriquées */}
                </td>
              ))}
              {actions && (
                <td>
                  <div className="inline-flex gap-2">
                    {actions.map((action, i) => (
                      <button
                        key={i}
                        className={`btn btn-${action.color} btn-sm mx-0.5 mr-1`}
                        onClick={() => action.onClick(row)}
                        type="button"
                      >
                        <i className={action.icon}></i>
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default Table;