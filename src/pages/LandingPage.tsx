import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircleOff,
  Search,
  ShieldCheck,
  HandCoins,
  Building2,
  MessageCircle,
  ShoppingBag,
  Wrench,
  Tags,
  Users,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

const CONTACT_MAILTO =
  'mailto:contato@ligabloco.com.br?subject=Quero%20o%20Liga%20Bloco%20no%20meu%20condom%C3%ADnio';

/** Reveal-on-scroll: adiciona .is-visible quando o elemento entra na viewport. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Mock de card de produto (visual do hero) ───────────────────────────── */
function MockCard({
  emoji,
  bg,
  tag,
  name,
  price,
  seller,
  className = '',
}: {
  emoji: string;
  bg: string;
  tag: string;
  name: string;
  price: string;
  seller: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`w-52 sm:w-60 rounded-xl border border-border bg-card shadow-warm-lg overflow-hidden ${className}`}
    >
      <div className="relative aspect-[4/3] flex items-center justify-center text-5xl" style={{ background: bg }}>
        {emoji}
        <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider bg-secondary/90 border border-border/60 rounded-full px-2 py-0.5">
          {tag}
        </span>
      </div>
      <div className="p-3 space-y-1">
        <p className="font-heading font-semibold text-sm leading-tight">{name}</p>
        <p className="font-heading font-semibold text-lg text-primary">
          <span className="text-[0.55em] align-super font-sans font-medium text-muted-foreground mr-0.5">R$</span>
          {price}
        </p>
        <p className="text-xs text-muted-foreground">{seller}</p>
      </div>
    </div>
  );
}

/* ── Página ─────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  useReveal();

  return (
    <div className="min-h-screen">
      {/* ── Top bar ── */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 h-20">
        <Logo size="sm" variant="onLight" />
        <nav className="flex items-center gap-3">
          <a
            href="#como-funciona"
            className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Como funciona
          </a>
          <a
            href="#faq"
            className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors mr-2"
          >
            Dúvidas
          </a>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/login" />}>
            Entrar
          </Button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-20 pb-20 sm:pb-28 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
        <div className="space-y-7">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Marketplace de condomínio
          </p>
          <h1 className="animate-fade-up [animation-delay:100ms] font-heading text-[2.6rem] leading-[1.05] sm:text-6xl font-semibold tracking-tight text-balance">
            O mercado do seu prédio, a um andar de distância.
          </h1>
          <p className="animate-fade-up [animation-delay:200ms] text-lg text-muted-foreground max-w-md leading-relaxed">
            Compre, venda e contrate serviços com quem mora ao seu lado. Sem taxas, sem
            estranhos — só vizinhos.
          </p>
          <div className="animate-fade-up [animation-delay:300ms] flex flex-col sm:flex-row gap-3 pt-2">
            <Button size="lg" nativeButton={false} render={<a href={CONTACT_MAILTO} />}>
              Quero no meu condomínio
              <ArrowRight aria-hidden className="size-4" data-icon="inline-end" />
            </Button>
            <Button variant="ghost" size="lg" nativeButton={false} render={<Link to="/login" />}>
              Já sou morador — entrar
            </Button>
          </div>
          <p className="animate-fade-up [animation-delay:400ms] text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin aria-hidden className="size-3.5 text-primary" />
            Cada condomínio tem seu próprio mural, fechado para quem mora lá.
          </p>
        </div>

        {/* Colagem de cards */}
        <div className="relative h-[360px] sm:h-[420px] hidden md:block" aria-hidden>
          <MockCard
            emoji="🍰"
            bg="#F5E6D3"
            tag="Comida caseira"
            name="Bolo de cenoura com chocolate"
            price="35,00"
            seller="Ana · Bloco B"
            className="absolute left-0 top-8 -rotate-3 animate-fade-up [animation-delay:350ms]"
          />
          <MockCard
            emoji="🚲"
            bg="#EDE3D4"
            tag="Esportes"
            name="Bicicleta aro 29 Caloi"
            price="850,00"
            seller="Fábio · Bloco D"
            className="absolute right-2 top-0 rotate-2 animate-fade-up [animation-delay:500ms]"
          />
          <MockCard
            emoji="🔩"
            bg="#F0E4CF"
            tag="Serviços"
            name="Montagem de móveis"
            price="80,00"
            seller="Sérgio · Bloco A"
            className="absolute left-24 bottom-0 rotate-1 animate-fade-up [animation-delay:650ms]"
          />
        </div>
      </section>

      {/* ── Social proof / trust strip ── */}
      <section className="border-y border-dashed border-border bg-secondary/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-medium text-foreground/80">
          <span className="flex items-center gap-2"><HandCoins aria-hidden className="size-4 text-primary" /> Zero taxas e comissões</span>
          <span className="flex items-center gap-2"><ShieldCheck aria-hidden className="size-4 text-primary" /> Acesso só por convite da administração</span>
          <span className="flex items-center gap-2"><Building2 aria-hidden className="size-4 text-primary" /> Dados isolados por condomínio</span>
          <span className="flex items-center gap-2"><MessageCircle aria-hidden className="size-4 text-primary" /> Negociação direto no WhatsApp</span>
        </div>
      </section>

      {/* ── Problema ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <div className="reveal max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">O problema</p>
          <h2 className="font-heading text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
            O grupo do condomínio não dá conta.
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 mt-14">
          {[
            {
              icon: MessageCircleOff,
              title: 'Anúncio engolido',
              text: 'Seu anúncio some atrás de 200 mensagens sobre a reunião do síndico em menos de uma hora.',
            },
            {
              icon: Search,
              title: 'Nada se encontra',
              text: 'Precisa de um eletricista? Boa sorte rolando o histórico do grupo até o ano passado.',
            },
            {
              icon: ShieldCheck,
              title: 'OLX é com estranhos',
              text: 'Vender pra fora significa marcar com desconhecidos, frete e plataformas cheias de taxa.',
            },
          ].map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="reveal rounded-xl border border-border bg-card p-6 shadow-warm-sm" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="size-11 rounded-lg bg-secondary flex items-center justify-center mb-4 -rotate-2">
                <Icon aria-hidden className="size-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Solução ── */}
      <section className="bg-sidebar text-sidebar-foreground">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32 grid lg:grid-cols-2 gap-14 items-center">
          <div className="reveal space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">A solução</p>
            <h2 className="font-heading text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
              Um mural organizado, só do seu prédio.
            </h2>
            <p className="text-sidebar-foreground/80 text-lg leading-relaxed max-w-md">
              O Liga Bloco é o quadro de avisos que o seu condomínio merecia: anúncios com
              foto e preço, busca por categoria, e o vendedor mora no bloco ao lado.
            </p>
            <ul className="space-y-3 text-sm text-sidebar-foreground/90">
              {[
                'Produtos e serviços separados, com categorias e busca',
                'Perfil de cada vizinho com seus anúncios',
                'Combina a entrega pelo WhatsApp — sem intermediário',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-1.5 size-1.5 rounded-full bg-secondary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-8" aria-hidden>
            {/* Mini-mural ilustrativo */}
            <p className="font-heading text-lg mb-4">📌 Mural · Residencial Parque Verde</p>
            <div className="space-y-3">
              {[
                ['🍞', 'Pão de fermentação natural', 'R$ 28', 'Maria · Bloco A'],
                ['🎸', 'Aulas de violão (iniciantes)', 'R$ 60/h', 'Rafael · Bloco B'],
                ['🪑', 'Cadeira de escritório', 'R$ 320', 'Paula · Bloco C'],
              ].map(([emoji, name, price, seller]) => (
                <div key={name} className="flex items-center gap-3 rounded-lg bg-white/10 border border-white/10 px-4 py-3">
                  <span className="text-2xl">{emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-sidebar-foreground/70">{seller}</p>
                  </div>
                  <span className="font-heading font-semibold text-secondary">{price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefícios ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <div className="reveal max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">Benefícios</p>
          <h2 className="font-heading text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
            Vender pro vizinho é diferente.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
          {[
            ['Confiança de porta ao lado', 'Quem compra e quem vende mora no mesmo endereço. Sem golpe, sem frete, sem encontro em posto de gasolina.'],
            ['Zero taxas, pra sempre', 'O Liga Bloco não fica com nada da sua venda. O preço que você anuncia é o que você recebe.'],
            ['Privacidade por condomínio', 'Seus anúncios só aparecem pra quem mora no seu condomínio. Cada prédio é um mural fechado.'],
            ['Do anúncio ao WhatsApp', 'Achou o que queria? Um toque abre a conversa com o vizinho. A entrega é no elevador.'],
          ].map(([title, text], i) => (
            <div key={title} className="reveal flex gap-5" style={{ transitionDelay: `${(i % 2) * 100}ms` }}>
              <span className="font-heading text-4xl font-semibold text-primary/30 leading-none select-none" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-heading font-semibold text-xl mb-1.5">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="bg-secondary/40 border-y border-dashed border-border scroll-mt-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <div className="reveal max-w-2xl mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">Como funciona</p>
            <h2 className="font-heading text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
              Três passos e o mural está de pé.
            </h2>
          </div>
          <ol className="grid sm:grid-cols-3 gap-6">
            {[
              ['A administração cadastra', 'Síndico ou administradora ativa o condomínio e importa a lista de moradores. Ninguém entra sem convite.'],
              ['O morador recebe o convite', 'Cada vizinho ativa a conta pelo link enviado por e-mail. Quem muda de prédio, sai do mural.'],
              ['Anuncia, encontra, combina', 'Foto, preço e pronto. O interessado chama no WhatsApp e vocês combinam no corredor.'],
            ].map(([title, text], i) => (
              <li key={title} className="reveal relative rounded-xl border border-border bg-card p-6 pt-8 shadow-warm-sm" style={{ transitionDelay: `${i * 100}ms` }}>
                <span className="absolute -top-4 left-6 size-9 rounded-full bg-primary text-primary-foreground font-heading font-semibold flex items-center justify-center shadow-warm-sm" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Recursos ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <div className="reveal max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">Recursos</p>
          <h2 className="font-heading text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
            Tudo que o mural precisa. Nada que atrapalhe.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            [ShoppingBag, 'Vitrine de produtos', 'Anúncios com fotos, preço e categoria — do bolo caseiro à bicicleta.'],
            [Wrench, 'Catálogo de serviços', 'Aulas, montagem, pet, beleza: vizinhos oferecendo o que sabem fazer.'],
            [Tags, 'Busca por categoria', 'Filtros e chips de categoria pra achar em segundos, não em scrolls.'],
            [Building2, 'Vários condomínios, uma conta', 'Mora ou administra mais de um? Troque de mural sem trocar de login.'],
            [Users, 'Gestão de moradores', 'A administração convida, ativa e remove moradores com controle total.'],
            [MessageCircle, 'Direto pro WhatsApp', 'Cada anúncio abre conversa direta com o vendedor. Sem chat interno pra ninguém olhar.'],
          ].map(([Icon, title, text], i) => {
            const IconComp = Icon as typeof ShoppingBag;
            return (
              <div key={title as string} className="reveal rounded-xl border border-border bg-card p-6 shadow-warm-sm hover:shadow-warm hover:-translate-y-0.5 transition-all" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                <IconComp aria-hidden className="size-6 text-primary mb-4" />
                <h3 className="font-heading font-semibold text-lg mb-1.5">{title as string}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-3xl mx-auto px-5 sm:px-8 pb-24 sm:pb-32 scroll-mt-8">
        <div className="reveal mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">Dúvidas frequentes</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight">Perguntas de vizinho.</h2>
        </div>
        <div className="reveal divide-y divide-border border-y border-border">
          {[
            ['Como eu entro no Liga Bloco?', 'O cadastro é feito pela administração do seu condomínio. Quando ela ativar o mural, você recebe um convite por e-mail com o link de ativação da sua conta.'],
            ['Quanto custa pra mim, morador?', 'Nada. Não há taxa de anúncio, comissão sobre venda nem plano pago para moradores.'],
            ['Quem vê os meus anúncios?', 'Apenas moradores do seu condomínio. Cada condomínio é um espaço isolado — nem moradores de outros prédios da mesma administradora veem seu mural.'],
            ['Como recebo o pagamento?', 'Direto com o comprador, do jeito que vocês combinarem: Pix, dinheiro, na entrega. O Liga Bloco não intermedia pagamentos na versão atual.'],
            ['Sou síndico ou administradora. Como contrato?', 'Fale com a gente pelo botão "Quero no meu condomínio" — ativamos o seu prédio e ajudamos a importar a lista de moradores.'],
            ['E se um morador se mudar?', 'A administração desativa o acesso dele àquele condomínio e os anúncios saem do mural. Simples assim.'],
          ].map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-medium text-[15px] hover:text-primary transition-colors [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="font-heading text-xl text-primary transition-transform group-open:rotate-45 shrink-0">+</span>
              </summary>
              <p className="pt-3 text-sm text-muted-foreground leading-relaxed max-w-xl">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-24 sm:pb-32">
        <div className="reveal rounded-2xl bg-sidebar text-sidebar-foreground px-8 py-14 sm:p-16 text-center space-y-6 shadow-warm-lg">
          <h2 className="font-heading text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
            Seu condomínio tem um mercado escondido.
          </h2>
          <p className="text-sidebar-foreground/80 max-w-md mx-auto text-lg">
            Destrave ele. Ative o Liga Bloco no seu prédio em menos de uma semana.
          </p>
          <div className="pt-2">
            <Button size="lg" nativeButton={false} render={<a href={CONTACT_MAILTO} />}>
              Quero no meu condomínio
              <ArrowRight aria-hidden className="size-4" data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-dashed border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo size="sm" variant="onLight" />
          <p>Feito para vizinhos. © {new Date().getFullYear()} Liga Bloco.</p>
          <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
        </div>
      </footer>
    </div>
  );
}
