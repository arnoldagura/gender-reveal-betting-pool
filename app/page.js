'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ViewOnlyStats() {
  const [bets, setBets] = useState([]);
  const [revealedGender, setRevealedGender] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'winners'
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    try {
      const [betsResponse, gameStateResponse] = await Promise.all([
        fetch('/api/bets'),
        fetch('/api/game-state'),
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

  const boyBets = bets.filter((bet) => bet.gender === 'boy');
  const girlBets = bets.filter((bet) => bet.gender === 'girl');
  const boyTotal = boyBets.reduce((sum, bet) => sum + bet.amount, 0);
  const girlTotal = girlBets.reduce((sum, bet) => sum + bet.amount, 0);

  // Payout ratio: multiply bet by this to get total payout (includes original bet)
  const boyPayoutRatio = boyTotal > 0 ? totalPot / boyTotal : 0;
  const girlPayoutRatio = girlTotal > 0 ? totalPot / girlTotal : 0;

  // Profit ratio: multiply bet by this to get profit only (excludes original bet)
  const boyProfitRatio = boyPayoutRatio > 0 ? boyPayoutRatio - 1 : 0;
  const girlProfitRatio = girlPayoutRatio > 0 ? girlPayoutRatio - 1 : 0;

  const winners = isRevealed
    ? bets.filter((bet) => bet.gender === revealedGender)
    : [];
  const winnerCount = winners.length;

  // Filter bets based on search query
  const filteredBets = bets
    .filter((bet) => bet.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredWinners = winners
    .filter((bet) => bet.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Calculate claimed count
  const claimedCount = winners.filter((winner) => winner.claimed).length;

  // Calculate individual winnings based on bet amount and payout ratio
  const calculateWinnings = (bet) => {
    if (!isRevealed || bet.gender !== revealedGender) return 0;
    const payoutRatio = bet.gender === 'boy' ? boyPayoutRatio : girlPayoutRatio;
    return bet.amount * payoutRatio;
  };

  // Calculate profit (winnings minus original bet)
  const calculateProfit = (bet) => {
    if (!isRevealed || bet.gender !== revealedGender) return 0;
    const winnings = calculateWinnings(bet);
    return winnings - bet.amount;
  };

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
      </div>

      {/* No Data Message */}
      {bets.length === 0 && (
        <div
          className='card'
          style={{ textAlign: 'center', padding: '48px 24px' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</div>
          <h2 className='card-title' style={{ marginBottom: '12px' }}>
            No Bets Yet
          </h2>
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
                {boyPayoutRatio > 0 ? `${boyPayoutRatio.toFixed(2)}x` : '--'}
              </span>
            </div>

            <div className='bet-stats'>
              <span className='bet-count'>
                {boyBets.length} bet{boyBets.length !== 1 ? 's' : ''}
              </span>
              <span className='bet-amount'>PHP {boyTotal.toFixed(2)}</span>
            </div>

            <div className='payout-preview'>
              Bet PHP 100 → Get PHP{' '}
              {boyPayoutRatio > 0 ? (100 * boyPayoutRatio).toFixed(2) : '0.00'}
              {boyProfitRatio > 0 && (
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.85em',
                    opacity: 0.9,
                    marginTop: '4px',
                  }}
                >
                  (Profit: PHP {(100 * boyProfitRatio).toFixed(2)})
                </span>
              )}
            </div>

            {isRevealed && revealedGender === 'boy' && (
              <div
                style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginTop: '12px',
                  fontWeight: '700',
                  fontSize: '1rem',
                }}
              >
                🏆 WINNER! 🏆
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
                {girlPayoutRatio > 0 ? `${girlPayoutRatio.toFixed(2)}x` : '--'}
              </span>
            </div>

            <div className='bet-stats'>
              <span className='bet-count'>
                {girlBets.length} bet{girlBets.length !== 1 ? 's' : ''}
              </span>
              <span className='bet-amount'>PHP {girlTotal.toFixed(2)}</span>
            </div>

            <div className='payout-preview'>
              Bet PHP 100 → Get PHP{' '}
              {girlPayoutRatio > 0
                ? (100 * girlPayoutRatio).toFixed(2)
                : '0.00'}
              {girlProfitRatio > 0 && (
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.85em',
                    opacity: 0.9,
                    marginTop: '4px',
                  }}
                >
                  (Profit: PHP {(100 * girlProfitRatio).toFixed(2)})
                </span>
              )}
            </div>

            {isRevealed && revealedGender === 'girl' && (
              <div
                style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginTop: '12px',
                  fontWeight: '700',
                  fontSize: '1rem',
                }}
              >
                🏆 WINNER! 🏆
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
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #ddd6fe 100%)',
              borderRadius: '12px',
              border: '2px solid #e0e7ff',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎲</div>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '8px',
              }}
            >
              Betting is OPEN!
            </h3>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              The gender has not been revealed yet. Bets are still being
              accepted!
            </p>
          </div>
        </div>
      )}

      {/* Tabbed Bets/Winners Section */}
      {bets.length > 0 && (
        <div className='card'>
          {/* Tab Headers */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid #e2e8f0',
              marginBottom: '24px',
            }}
          >
            <button
              onClick={() => setActiveTab('all')}
              style={{
                flex: 1,
                padding: '16px 24px',
                background:
                  activeTab === 'all'
                    ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                    : 'transparent',
                color: activeTab === 'all' ? 'white' : '#64748b',
                border: 'none',
                borderBottom:
                  activeTab === 'all'
                    ? '3px solid #4b5563'
                    : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                borderRadius: '8px 8px 0 0',
              }}
            >
              📋 All Bets ({bets.length})
            </button>
            {isRevealed && (
              <button
                onClick={() => setActiveTab('winners')}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background:
                    activeTab === 'winners'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'transparent',
                  color: activeTab === 'winners' ? 'white' : '#64748b',
                  border: 'none',
                  borderBottom:
                    activeTab === 'winners'
                      ? '3px solid #d97706'
                      : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  borderRadius: '8px 8px 0 0',
                }}
              >
                🏆 Winners ({winners.length}) - {claimedCount} Claimed
              </button>
            )}
          </div>

          {/* Search Input */}
          <div style={{ marginBottom: '24px' }}>
            <div className='form-group'>
              <label className='form-label'>🔍 Search by Name</label>
              <input
                type='text'
                className='form-input'
                placeholder='Type a name to search...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '0.9rem',
                  color: '#64748b',
                }}
              >
                {activeTab === 'all'
                  ? `Showing ${filteredBets.length} of ${bets.length} bets`
                  : `Showing ${filteredWinners.length} of ${winners.length} winners`}
              </div>
            )}
          </div>

          {/* Tab Content - All Bets */}
          {activeTab === 'all' && (
            <>
              {filteredBets.length > 0 ? (
                <div className='bets-grid'>
                  {filteredBets.map((bet) => (
                    <div
                      key={bet.id}
                      className={`bet-card ${
                        isRevealed && bet.gender === revealedGender
                          ? 'winner'
                          : ''
                      }`}
                    >
                      <div className='bet-info'>
                        <div className='bet-name'>{bet.name || 'Unknown'}</div>
                        <span className={`bet-gender ${bet.gender}`}>
                          {bet.gender === 'boy' ? '👶 Boy' : '👧 Girl'}
                        </span>
                        <div className='bet-amount'>
                          PHP {(bet.amount || 0).toFixed(2)}
                        </div>
                        {isRevealed && bet.gender === revealedGender && (
                          <div className='winner-badge'>🎉 Winner!</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                    🔍
                  </div>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '8px',
                    }}
                  >
                    No bets found
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1rem' }}>
                    No bets match your search "{searchQuery}"
                  </p>
                </div>
              )}
            </>
          )}

          {/* Tab Content - Winners */}
          {activeTab === 'winners' && isRevealed && (
            <div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  background:
                    'linear-gradient(135deg, #fef3c7 0%, #ddd6fe 100%)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  border: '2px solid #e0e7ff',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '8px',
                  }}
                >
                  🎊 The Results Are In! 🎊
                </h2>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    background:
                      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginTop: '8px',
                  }}
                >
                  It's a {revealedGender === 'boy' ? 'Boy! 👶' : 'Girl! 👧'}
                </div>
              </div>

              {filteredWinners.length > 0 ? (
                <div className='winners-grid'>
                  {filteredWinners.map((winner) => (
                    <div key={winner.id} className='winner-card'>
                      <div className='winner-name'>{winner.name}</div>
                      <div>Bet: PHP {winner.amount.toFixed(2)}</div>
                      <div className='winner-payout'>
                        Total Payout: PHP {calculateWinnings(winner).toFixed(2)}
                      </div>
                      <div
                        style={{
                          fontSize: '0.9em',
                          opacity: 0.9,
                          marginTop: '4px',
                        }}
                      >
                        Profit: PHP {calculateProfit(winner).toFixed(2)}
                      </div>
                      {winner.claimed && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            textAlign: 'center',
                          }}
                        >
                          ✓ Claimed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                    🔍
                  </div>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '8px',
                    }}
                  >
                    No winners found
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1rem' }}>
                    No winners match your search "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                    😅
                  </div>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '8px',
                    }}
                  >
                    No Winners!
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1rem' }}>
                    Nobody bet on {revealedGender === 'boy' ? 'boy' : 'girl'}!
                    The house wins this time! 🏠
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div
        style={{
          textAlign: 'center',
          padding: '24px',
          color: '#64748b',
          fontSize: '0.875rem',
          borderTop: '1px solid #e2e8f0',
          marginTop: '32px',
        }}
      >
        <p>📊 This is a read-only view of the betting pool</p>
        <p>🔄 Data updates automatically every 5 seconds</p>
      </div>
    </div>
  );
}
