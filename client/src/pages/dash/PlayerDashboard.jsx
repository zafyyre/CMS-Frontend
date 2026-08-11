import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useApi } from '../../api.js';
import { Spinner, ErrorBox, Empty, MatchRow } from '../../components/ui.jsx';
import { StatTiles, DocumentsPanel } from '../../components/portal.jsx';
import { PortalHeader } from './CoachDashboard.jsx';

const PLAYER_DOCS = ['Photo ID', 'Player Registration Form', 'Medical Consent Form', 'Proof of Age', 'Player Photo'];
const POS_LABEL = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' };

export default function PlayerDashboard() {
  const { user, logout } = useAuth();
  const { data, loading, error } = useApi('/player/dashboard');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;

  const { player, team, position, upcoming, recent, registrationStatus } = data;
  const subtitle = team
    ? `${POS_LABEL[player.position] || player.position} · #${player.jersey} · ${team.name}`
    : POS_LABEL[player.position] || player.position;

  return (
    <div className="section-gap">
      <PortalHeader eyebrow="Player Portal" title={player.name} subtitle={subtitle}
        color={team?.color} user={user} onLogout={logout} />

      {registrationStatus === 'pending' && (
        <div className="card card-pad" style={{ background: '#fbf1dd', borderColor: '#f0dcb4' }}>
          <strong>⏳ Registration pending approval.</strong>
          <span className="muted"> Your account is awaiting review by the league registrar. Upload your required documents below to speed things up.</span>
        </div>
      )}

      <StatTiles items={[
        { n: player.appearances, k: 'Appearances' },
        { n: player.goals, k: 'Goals' },
        { n: player.assists, k: 'Assists' },
        { n: `${player.yellow_cards}/${player.red_cards}`, k: 'Yellow / Red' },
      ]} />

      {team && (
        <div className="grid grid-2" style={{ gap: 20 }}>
          <section className="card">
            <div className="card-head">
              <h3>My Team</h3>
              <Link to={`/teams/${team.slug}`} className="linklike" style={{ fontSize: 13 }}>{team.name} →</Link>
            </div>
            <div className="card-pad">
              <div style={{ fontSize: 14 }} className="muted">{team.division}</div>
              {position && <div style={{ marginTop: 6 }}>Currently <strong>#{position.rank}</strong> · {position.pts} pts · {position.w}W {position.d}D {position.l}L</div>}
            </div>
          </section>
          <section className="card">
            <div className="card-head"><h3>Next Fixtures</h3></div>
            {upcoming.length === 0 ? <Empty>No upcoming fixtures.</Empty> : upcoming.slice(0, 3).map((m) => <MatchRow key={m.id} m={m} showDivision />)}
          </section>
        </div>
      )}

      {team && recent.length > 0 && (
        <section className="card">
          <div className="card-head"><h3>Recent Results</h3></div>
          {recent.map((m) => <MatchRow key={m.id} m={m} showDivision />)}
        </section>
      )}

      <DocumentsPanel presetTypes={PLAYER_DOCS} title="My Registration Documents" />
    </div>
  );
}
