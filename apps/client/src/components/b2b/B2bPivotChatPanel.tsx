import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LoaderCircle, Send, X } from 'lucide-react';
import { b2bService, type B2bPivotChatMessage } from '../../services/b2bService';
import { useB2bStore } from '../../store/useB2bStore';
import './B2bPivotChatPanel.css';

type LiveChatMessage = B2bPivotChatMessage;

function mergeMessages(current: LiveChatMessage[], incoming: LiveChatMessage[]): LiveChatMessage[] {
  const messages = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) messages.set(message.id, message);
  return [...messages.values()].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
}

export function B2bPivotChatPanel({ conversationId, onClose }: { conversationId: string | null; onClose: () => void }) {
  const userId = useB2bStore((state) => state.user?.userId);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [isPivot, setIsPivot] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    setMessages([]);
    setDraft('');
    setError('');
    setLoading(true);

    const handleLiveMessage = (event: Event) => {
      const message = (event as CustomEvent<LiveChatMessage>).detail;
      if (message?.conversationId === conversationId) {
        setMessages((current) => mergeMessages(current, [message]));
      }
    };
    window.addEventListener('b2b-pivot-chat-message', handleLiveMessage);
    b2bService.getPivotChat(conversationId)
      .then((chat) => {
        if (!active) return;
        setIsPivot(chat.isPivot);
        setMessages((current) => mergeMessages(current, chat.messages));
      })
      .catch(() => { if (active) setError('No se pudo abrir esta conversación.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      window.removeEventListener('b2b-pivot-chat-message', handleLiveMessage);
    };
  }, [conversationId]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!conversationId || !body || sending) return;
    setSending(true);
    setError('');
    try {
      const message = await b2bService.sendPivotChatMessage(conversationId, body);
      setMessages((current) => mergeMessages(current, [message]));
      setDraft('');
    } catch {
      setError('No se pudo enviar el mensaje. Volvé a intentar.');
    } finally {
      setSending(false);
    }
  };

  if (!conversationId) return null;
  const otherParticipant = isPivot ? 'Jugador interesado' : 'Jugador pivote';

  return (
    <div className="b2b-pivot-chat-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="b2b-pivot-chat" role="dialog" aria-modal="true" aria-labelledby="b2b-pivot-chat-title">
        <header className="b2b-pivot-chat-header">
          <div><span className="eyebrow"><i /> SOLICITUD DE PARTIDO</span><h2 id="b2b-pivot-chat-title">Chat privado</h2><small>{otherParticipant}</small></div>
          <button className="icon-button" type="button" aria-label="Cerrar chat" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="b2b-pivot-chat-messages" ref={messagesRef} aria-live="polite">
          {loading && <div className="b2b-pivot-chat-state"><LoaderCircle size={18} className="animate-spin" /> Cargando conversación…</div>}
          {!loading && messages.length === 0 && <div className="b2b-pivot-chat-state">Escribí para coordinar el partido.</div>}
          {messages.map((message) => {
            const own = message.senderUserId === userId;
            return <article key={message.id} className={`b2b-pivot-message ${own ? 'is-own' : ''}`}>
              <small>{own ? 'Vos' : otherParticipant}</small>
              <p>{message.body}</p>
              <time>{new Date(message.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</time>
            </article>;
          })}
        </div>
        {error && <p className="b2b-pivot-chat-error" role="alert">{error}</p>}
        <form className="b2b-pivot-chat-compose" onSubmit={(event) => void send(event)}>
          <textarea aria-label="Mensaje" maxLength={1000} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribí un mensaje…" />
          <button className="primary-action" type="submit" disabled={!draft.trim() || sending || loading} aria-label="Enviar mensaje" title="Enviar mensaje">
            {sending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </form>
      </section>
    </div>
  );
}