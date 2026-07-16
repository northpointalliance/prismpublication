import { useState, useRef, useEffect } from 'react';

// Varied bot responses per niche — randomly picked each turn
const BOT_REPLIES = {
  'health-fitness': [
    "Good question. Consistency beats intensity every time — focus on showing up rather than going all-out. Three solid sessions a week will outperform five exhausting ones you can't sustain.",
    "Recovery is where the gains actually happen. Your muscles don't grow in the gym — they grow while you sleep. Aim for 7–9 hours and don't skip rest days.",
    "Protein is probably the one thing most people underdo. Shoot for 0.8–1g per pound of bodyweight. Eggs, Greek yogurt, chicken, cottage cheese — simple sources that add up fast.",
    "For fat loss, resistance training beats pure cardio. Muscle increases your resting metabolism, so you burn more even at rest. Cardio is a bonus, not the strategy.",
    "Progressive overload is the principle — add a little more weight or a rep or two each week. Without that, your body adapts and stops changing.",
    "Hydration is underrated. Even mild dehydration tanks strength and focus. A liter of water before you start your day is a good anchor habit.",
  ],
  wellness: [
    "That resonates. Even 5 minutes of intentional stillness — no phone, no input — can genuinely shift your baseline. It's not about duration, it's about the pause itself.",
    "Sleep is the highest-leverage wellness habit you have. If that's off, everything else — mood, focus, patience — follows. Dimming lights an hour before bed helps more than people expect.",
    "Box breathing is worth trying: 4 counts in, hold 4, out 4, hold 4. It directly activates the parasympathetic system. Hard to feel stressed while doing it properly.",
    "Journaling sounds like self-help fluff until you actually try it. Getting thoughts out of your head and onto a page makes them easier to look at — and often smaller than they felt.",
    "You don't have to overhaul everything at once. One anchor habit — same time, same place, same action — tends to pull other habits into orbit around it.",
    "Social connection is one of the biggest drivers of wellbeing that people undervalue. Reaching out to someone, even briefly, can shift your whole day.",
  ],
  'persona-app': [
    "The best thing you can do in that situation is stay curious — ask questions and actually listen. People remember how they felt in a conversation more than what was said.",
    "Being yourself is the actual strategy, not a platitude. Trying to be who you think someone wants you to be is exhausting, and it doesn't hold up over time.",
    "Confidence mostly comes from being comfortable with silence. Not every moment needs to be filled. Ease reads as confidence even when it's just relaxed.",
    "First impressions are overrated. Most real connections develop over multiple interactions — don't write something off after one awkward start.",
    "If you're not sure what to say, ask what someone is excited about right now. People open up quickly when they're talking about something they care about.",
    "Humor works when it's natural, not when it's performed. Light self-deprecation — not self-pity — tends to land better than trying to be impressive.",
  ],
};

const getReply = (niche) => {
  const replies = BOT_REPLIES[niche] || ['Thanks for sharing that. Here\'s something that might help.'];
  return replies[Math.floor(Math.random() * replies.length)];
};

export default function ChatWidget({ niche, title, subtitle, placeholder, botGreeting, ageGate }) {
  const [messages, setMessages] = useState([{ role: 'bot', text: botGreeting }]);
  const [input, setInput] = useState('');
  const [adLoading, setAdLoading] = useState(false);
  const scrollRef = useRef(null);
  const msgCountRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, adLoading]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    msgCountRef.current += 1;
    const botReply = getReply(niche);

    // Show user + bot reply immediately
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'bot', text: botReply },
    ]);

    // Fetch a real ad from Prism on every other message
    if (msgCountRef.current % 2 === 0) {
      setAdLoading(true);
      try {
        const res = await fetch(`/api/ad/${niche}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ad) {
            setMessages((prev) => [...prev, { role: 'ad', ad: data.ad }]);
          }
        }
      } catch (_) {
        // Silent fail — demo continues without ad
      } finally {
        setAdLoading(false);
      }
    }
  };

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      border: '1px solid #2a2a2a',
      borderRadius: 12,
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
      background: '#0a0a0a',
      color: '#f5f5f5',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#a3a3a3' }}>{subtitle}</div>
        {ageGate && (
          <div style={{
            marginTop: 8, fontSize: 11, fontWeight: 600, color: '#facc15',
            border: '1px solid #facc15', borderRadius: 6, padding: '4px 8px',
            display: 'inline-block',
          }}>
            {ageGate}
          </div>
        )}
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        style={{
          height: 380,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.map((msg, i) => {
          if (msg.role === 'ad') {
            return <AdCard key={i} ad={msg.ad} niche={niche} />;
          }
          return (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: msg.role === 'user' ? '#2563eb' : '#1f1f1f',
                color: '#f5f5f5',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {msg.text}
            </div>
          );
        })}

        {adLoading && (
          <div style={{
            alignSelf: 'flex-start',
            background: '#111827',
            border: '1px solid #1e293b',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 12,
            color: '#475569',
          }}>
            Finding a relevant partner...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', borderTop: '1px solid #2a2a2a' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '12px 14px',
            background: 'transparent',
            border: 'none',
            color: '#f5f5f5',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          style={{
            padding: '0 18px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// Ad card component — renders a real Prism ad
function AdCard({ ad, niche }) {
  const handleClick = async () => {
    try {
      await fetch(`/api/click/${niche}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad.id }),
      });
    } catch (_) {
      // Silent fail
    }
  };

  return (
    <div style={{
      alignSelf: 'flex-start',
      maxWidth: '90%',
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{
        fontSize: 10,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 6,
      }}>
        Sponsored · {ad.advertiser}
      </div>
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#f1f5f9',
        marginBottom: 4,
        lineHeight: 1.4,
      }}>
        {ad.title}
      </div>
      <div style={{
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 12,
        lineHeight: 1.5,
      }}>
        {ad.description}
      </div>
      <a
        href={ad.clickUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        style={{
          display: 'inline-block',
          fontSize: 13,
          fontWeight: 600,
          background: '#38bdf8',
          color: '#fff',
          borderRadius: 7,
          padding: '7px 14px',
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        {ad.ctaText} →
      </a>
    </div>
  );
}
