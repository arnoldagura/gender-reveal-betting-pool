'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ViewOnlyStats() {
  const [bets, setBets] = useState([]);
  const [revealedGender, setRevealedGender] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  const fetchData = async () => {
    try {
      const [betsResponse, gameStateResponse] = await Promise.all([
        fetch('/api/bets'),
        fetch('/api/game-state')
      ]);
      
      const betsData = await betsResponse.json();
      const gameStateData = await gameStateResponse.json();
      
      setBets(betsData);
      setRevealedGender(gameStateData.revealed_gender);
      setIsRevealed(gameStateData.is_revealed);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate totals and winners
  const totalPot = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const winners = isRevealed
    ? bets.filter((bet) => bet.gender === revealedGender)
    : [];
  const winnerCount = winners.length;
  const winningsPerWinner = winnerCount > 0 ? totalPot / winnerCount : 0;

  const boyBets = bets.filter((bet) => bet.gender === 'boy');
  const girlBets = bets.filter((bet) => bet.gender === 'girl');
  const boyTotal = boyBets.reduce((sum, bet) => sum + bet.amount, 0);
  const girlTotal = girlBets.reduce((sum, bet) => sum + bet.amount, 0);

  const boyWinningRatio = boyTotal > 0 ? totalPot / boyTotal : 0;
  const girlWinningRatio = girlTotal > 0 ? totalPot / girlTotal : 0;

  if (loading) {
    return (
      <div className='container' style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
        <h2>Loading live stats...</h2>
      </div>
    );
  }

  return (
    <div className='container'>
      <Head>
        <title>Gender Reveal Betting Pool - Live Stats</title>
        <meta
          name='description'
          content="Live view of the baby's gender betting pool!"
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      {/* Header */}
      <div className='header'>
        <h1 className='main-title'>🎲 Live Betting Stats</h1>
        <p className='subtitle'>Real-time odds and statistics 📊</p>
        {!isRevealed && (
          <div style={{ 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            display: 'inline-block', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            marginTop: '12px'
          }}>
            🔄 Auto-refreshing every 5 seconds
          </div>
        )}
      </div>

      {/* No Data Message */}
      {bets.length === 0 && (
        <div className='card' style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</div>
          <h2 className='card-title' style={{ marginBottom: '12px' }}>No Bets Yet</h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
            Waiting for the first brave soul to place a bet! 🎲
          </p>
        </div>
      )}

      {/* Odds Display */}
      {bets.length > 0 && (
        <div className='odds-container'>
          {/* Boy Odds Card */}
          <div className='odds-card boy'>
            <div className='odds-header'>
              <span className='odds-emoji'>👶</span>
              <h3 className='odds-title'>Team Boy</h3>
            </div>

            <div className='win-ratio'>
              <span className='ratio-label'>Win Ratio</span>
              <span className='ratio-value'>
                {boyWinningRatio > 0 ? `${boyWinningRatio.toFixed(2)}x` : '--'}
              </span>
            </div>

            <div className='bet-stats'>
              <span className='bet-count'>
                {boyBets.length} bet{boyBets.length !== 1 ? 's' : ''}
              </span>
              <span className='bet-amount'>PHP {boyTotal.toFixed(2)}</span>
            </div>

            <div className='payout-preview'>
              Bet PHP 10 → Win PHP{' '}
              {boyWinningRatio > 0 ? (10 * boyWinningRatio).toFixed(2) : '0.00'}
            </div>

            {isRevealed && revealedGender === 'boy' && (
              <div style={{
                background: '#10b981',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                marginTop: '12px',
                fontWeight: '700',
                fontSize: '1rem'
              }}>
                🏆 WINNERS! 🏆
              </div>
            )}
          </div>

          {/* Girl Odds Card */}
          <div className='odds-card girl'>
            <div className='odds-header'>
              <span className='odds-emoji'>👧</span>
              <h3 className='odds-title'>Team Girl</h3>
            </div>

            <div className='win-ratio'>
              <span className='ratio-label'>Win Ratio</span>
              <span className='ratio-value'>
                {girlWinningRatio > 0
                  ? `${girlWinningRatio.toFixed(2)}x`
                  : '--'}
              </span>
            </div>

            <div className='bet-stats'>
              <span className='bet-count'>
                {girlBets.length} bet{girlBets.length !== 1 ? 's' : ''}
              </span>
              <span className='bet-amount'>PHP {girlTotal.toFixed(2)}</span>
            </div>

            <div className='payout-preview'>
              Bet PHP 10 → Win PHP{' '}
              {girlWinningRatio > 0
                ? (10 * girlWinningRatio).toFixed(2)
                : '0.00'}
            </div>

            {isRevealed && revealedGender === 'girl' && (
              <div style={{
                background: '#10b981',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                marginTop: '12px',
                fontWeight: '700',
                fontSize: '1rem'
              }}>
                🏆 WINNERS! 🏆
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pool Status */}
      {bets.length > 0 && (
        <div className='pool-status'>
          <div className='status-card'>
            <div className='status-label'>Total Pool</div>
            <div className='status-value'>PHP {totalPot.toFixed(2)}</div>
          </div>
          <div className='status-card'>
            <div className='status-label'>Boy Bets</div>
            <div className='status-value'>{boyBets.length}</div>
          </div>
          <div className='status-card'>
            <div className='status-label'>Girl Bets</div>
            <div className='status-value'>{girlBets.length}</div>
          </div>
          <div className='status-card'>
            <div className='status-label'>Total Bets</div>
            <div className='status-value'>{bets.length}</div>
          </div>
        </div>
      )}

      {/* Betting Status */}
      {bets.length > 0 && !isRevealed && (
        <div className='card'>
          <div className='card-header'>
            <span className='card-icon'>⏰</span>
            <h2 className='card-title'>Betting Status</h2>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '24px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #ddd6fe 100%)',
            borderRadius: '12px',
            border: '2px solid #e0e7ff'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎲</div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: '#1e293b',
              marginBottom: '8px' 
            }}>
              Betting is OPEN!
            </h3>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              The gender has not been revealed yet. Bets are still being accepted!
            </p>
          </div>
        </div>
      )}

      {/* All Bets List */}
      {safeBets.length > 0 && (
        <div className='card'>
          <div className='card-header'>
            <span className='card-icon'>📋</span>
            <h2 className='card-title'>All Bets ({safeBets.length})</h2>
          </div>

          <div className='bets-grid'>
            {safeBets.map((bet) => (
              <div
                key={bet.id}
                className={`bet-card ${
                  isRevealed && bet.gender === revealedGender ? 'winner' : ''
                }`}
              >
                <div className='bet-info'>
                  <div className='bet-name'>{bet.name || 'Unknown'}</div>
                  <span className={`bet-gender ${bet.gender}`}>
                    {bet.gender === 'boy' ? '👶 Boy' : '👧 Girl'}
                  </span>
                  <div className='bet-amount'>PHP {(bet.amount || 0).toFixed(2)}</div>
                  {isRevealed && bet.gender === revealedGender && (
                    <div className='winner-badge'>🎉 Winner!</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Winners Display */}
      {isRevealed && (
        <div className='winners-section'>
          <h2 className='card-title'>🎊 The Results Are In! 🎊</h2>
          <div className='result-announcement'>
            It's a {revealedGender === 'boy' ? 'Boy! 👶' : 'Girl! 👧'}
          </div>

          {winners.length > 0 ? (
            <div>
              <h3 className='card-title'>🏆 Winners ({winners.length}):</h3>
              <div className='winners-grid'>
                {winners.map((winner) => (
                  <div key={winner.id} className='winner-card'>
                    <div className='winner-name'>{winner.name}</div>
                    <div>Bet: PHP {winner.amount.toFixed(2)}</div>
                    <div className='winner-payout'>
                      Wins: PHP {winningsPerWinner.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className='no-winners'>
              <h3>😅 No Winners!</h3>
              <p>
                Nobody bet on {revealedGender === 'boy' ? 'boy' : 'girl'}! The
                house wins this time! 🏠
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div style={{
        textAlign: 'center',
        padding: '24px',
        color: '#64748b',
        fontSize: '0.875rem',
        borderTop: '1px solid #e2e8f0',
        marginTop: '32px'
      }}>
        <p>📊 This is a read-only view of the betting pool</p>
        <p>🔄 Data updates automatically every 5 seconds</p>
        <p>💾 All data is stored in the database</p>
      </div>
    </div>
  );
}