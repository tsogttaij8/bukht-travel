export default function Features(){
  return(
    <section className="container">

      <h2>Онцлох</h2>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>

        <div className="card">
          <h3>Хямд үнэ</h3>
        </div>

        <div className="card">
          <h3>Найдвартай хүргэлт</h3>
        </div>

        <div className="card">
          <h3>Хялбар захиалга</h3>
        </div>

      </div>

    </section>
  )
}