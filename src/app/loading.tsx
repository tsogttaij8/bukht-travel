export default function Loading() {
  return <main className="home-loading" aria-label="Хуудас ачаалж байна" aria-busy="true"><div className="home-shell"><div className="skeleton skeleton--hero" /><div className="skeleton-row">{Array.from({ length: 3 }, (_, index) => <div className="skeleton skeleton--travel" key={index} />)}</div><div className="skeleton-row skeleton-row--products">{Array.from({ length: 5 }, (_, index) => <div className="skeleton skeleton--product" key={index} />)}</div></div></main>
}
