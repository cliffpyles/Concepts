import { useMemo } from "react";
import pensData from "./data/pens.json";
import type { Pen } from "./types/pen";
import "./App.css";

const pens = pensData.pens as Pen[];

function PenCard({ pen }: { pen: Pen }) {
  const thumb = pen.images?.large ?? pen.images?.small ?? "/favicon.svg";
  return (
    <a
      href={pen.link}
      target="_blank"
      rel="noopener noreferrer"
      className="pen-card"
      aria-label={`View ${pen.title}`}
    >
      <div className="pen-card__thumb">
        <img src={thumb} alt="" loading="lazy" />
      </div>
      <div className="pen-card__body">
        <h3 className="pen-card__title">{pen.title}</h3>
        {pen.details && (
          <p className="pen-card__details">{pen.details.slice(0, 120)}…</p>
        )}
        <div className="pen-card__meta">
          {pen.views && <span>👁 {pen.views}</span>}
          {pen.loves && <span>❤ {pen.loves}</span>}
          {pen.comments && <span>💬 {pen.comments}</span>}
        </div>
      </div>
    </a>
  );
}

function LogItem({ pen }: { pen: Pen }) {
  const thumb = pen.images?.small ?? pen.images?.large ?? "/favicon.svg";
  const addedDate = pen.firstSeen
    ? new Date(pen.firstSeen).toLocaleDateString(undefined, {
        dateStyle: "medium",
      })
    : null;

  return (
    <article className="log-item">
      <div className="log-item__thumb">
        <img src={thumb} alt="" loading="lazy" />
      </div>
      <div className="log-item__content">
        <h4 className="log-item__title">
          <a href={pen.link} target="_blank" rel="noopener noreferrer">
            {pen.title}
          </a>
        </h4>
        {pen.details && <p className="log-item__details">{pen.details}</p>}
        <dl className="log-item__meta">
          <dt>ID</dt>
          <dd>{pen.id}</dd>
          <dt>Link</dt>
          <dd>
            <a href={pen.link} target="_blank" rel="noopener noreferrer">
              {pen.link}
            </a>
          </dd>
          {pen.views && (
            <>
              <dt>Views</dt>
              <dd>{pen.views}</dd>
            </>
          )}
          {pen.loves && (
            <>
              <dt>Loves</dt>
              <dd>{pen.loves}</dd>
            </>
          )}
          {pen.comments && (
            <>
              <dt>Comments</dt>
              <dd>{pen.comments}</dd>
            </>
          )}
          {addedDate && (
            <>
              <dt>Added to log</dt>
              <dd>{addedDate}</dd>
            </>
          )}
        </dl>
      </div>
    </article>
  );
}

function App() {
  const logPens = useMemo(
    () =>
      [...pens].sort((a, b) => {
        const aSeen = a.firstSeen ?? "";
        const bSeen = b.firstSeen ?? "";
        return bSeen.localeCompare(aSeen);
      }),
    []
  );

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">Concepts</h1>
        <p className="header__subtitle">
          <a
            href="https://codepen.io/cliffpyles"
            target="_blank"
            rel="noopener noreferrer"
          >
            @cliffpyles
          </a>
          {pensData.lastSynced && (
            <span className="header__synced">
              Last synced: {new Date(pensData.lastSynced).toLocaleString()}
            </span>
          )}
        </p>
      </header>

      <main className="main">
        <section className="section section--demo">
          <h2>Demo</h2>
          <p className="section__intro">
            Click any concept to open it. Pens sync from CodePen; additional
            sources may be added later.
          </p>
          <div className="pen-grid">
            {pens.length === 0 ? (
              <p className="empty-state">
                No concepts yet. Run <code>npm run sync</code> to fetch from
                CodePen, or add pens to{" "}
                <code>src/data/pens.manual.json</code>.
              </p>
            ) : (
              pens.map((pen) => <PenCard key={pen.id} pen={pen} />)
            )}
          </div>
        </section>

        <section className="section section--log">
          <h2>Pen Log</h2>
          <p className="section__intro">
            Concepts appear here when synced. New items are added automatically
            with full details.
          </p>
          <div className="log">
            {logPens.length === 0 ? (
              <p className="empty-state">
                Log is empty. Run sync to populate.
              </p>
            ) : (
              logPens.map((pen) => <LogItem key={pen.id} pen={pen} />)
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <a
          href="https://codepen.io/cliffpyles"
          target="_blank"
          rel="noopener noreferrer"
        >
          View all pens on CodePen →
        </a>
      </footer>
    </div>
  );
}

export default App;
