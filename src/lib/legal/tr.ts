import { HOST, PROCESSORS, PUBLISHER, type LegalDoc } from "./types";

const processors = PROCESSORS.map((p) => `${p.name} — ${p.role} — ${p.region}`);

export const mentions: LegalDoc = {
  slug: "mentions",
  title: "Yasal bilgiler",
  intro:
    "voisini.com sitesinin yayıncısına ve barındırıcısına ilişkin bilgiler (Fransa, 21 Haziran 2004 tarihli 2004-575 sayılı LCEN kanunu uyarınca).",
  sections: [
    {
      h: "Sitenin yayıncısı",
      p: [
        `voisini.com sitesi, ${PUBLISHER.country}'da yaşayan ve ticari olmayan sıfatla hareket eden gerçek kişi ${PUBLISHER.name} tarafından yayımlanmaktadır.`,
        `İletişim: ${PUBLISHER.email}`,
        "LCEN 6. maddesinin III-2 fıkrası uyarınca, ticari faaliyet yürütmeyen yayıncı posta adresini yayımlamak zorunda değildir; bu bilgi barındırıcı nezdinde yetkili makamların erişimine açıktır.",
      ],
    },
    { h: "Yayın sorumlusu", p: [PUBLISHER.name] },
    { h: "Barındırıcı", p: [`${HOST.name}, ${HOST.address} — ${HOST.site}`] },
    {
      h: "Hizmetin niteliği",
      p: [
        "Voisini, komşuların eşya satması, vermesi, ödünç vermesi, kiralaması ya da takas etmesi için bir buluşturma platformudur. Voisini ne satıcı, ne alıcı, ne kiraya verendir: site yalnızca tarafları buluşturur, anlaşmayı taraflar kendi aralarında yapar.",
        "Hizmet şu an ücretsizdir. Herhangi bir komisyon alınmamakta ve site üzerinden herhangi bir ödeme işlenmemektedir.",
      ],
    },
    {
      h: "Fikri mülkiyet",
      p: [
        "Voisini adı, logosu, metinleri ve arayüzü yayıncıya aittir. İzinsiz çoğaltılamaz.",
        "İlanlardaki fotoğraf ve açıklamalar sahiplerine aittir; ilan yayında kaldığı süre boyunca Voisini'ye sınırlı bir görüntüleme izni verilmiş sayılır.",
      ],
    },
    {
      h: "İçerik bildirimi",
      p: [
        `Hukuka aykırı içerikler her ilanın üzerindeki "Şikayet et" düğmesinden ya da ${PUBLISHER.email} adresine e-posta ile bildirilebilir. Bildirimler en kısa sürede incelenir.`,
      ],
    },
  ],
};

export const terms: LegalDoc = {
  slug: "terms",
  title: "Kullanım şartları",
  intro:
    "Bu şartlar voisini.com sitesinin kullanımını düzenler. Hesap açarak bunları kabul etmiş olursunuz.",
  sections: [
    {
      h: "1. Konu",
      p: [
        "Voisini, birbirine yakın oturan kişileri eşya satmak, vermek, ödünç vermek, kiralamak veya takas etmek üzere buluşturur.",
        "Voisini üyeler arasındaki anlaşmaların tarafı değildir. Sitede sunulan eşyaların varlığını, kalitesini, açıklamaya uygunluğunu veya alışverişin düzgün tamamlanacağını garanti etmez.",
      ],
    },
    {
      h: "2. Üyelik",
      p: [
        "Üyelik ücretsizdir ve 18 yaşını doldurmuş kişilere açıktır.",
        "Doğru bilgi vermeyi ve şifrenizi gizli tutmayı kabul edersiniz. Hesap kişiseldir; hesabınızda olan her şeyden siz sorumlusunuz.",
      ],
    },
    {
      h: "3. İlan içeriği",
      p: [
        "Yayımladığınız eşyaları sunmaya hakkınız olduğunu ve dolaşıma sokulmasının hukuka uygun olduğunu taahhüt edersiniz.",
        "Özellikle yasaktır: silahlar, uyuşturucular, ilaçlar, canlı hayvanlar, taklit ürünler, çalıntı mallar, cinsel içerikler, üçüncü kişilere ait kişisel veriler ve gerekli izinlere sahip olmadığınız hâlde satışı düzenlemeye tabi her türlü eşya.",
        "Voisini bu kurallara veya hukuka aykırı ilanları önceden haber vermeden kaldırabilir.",
      ],
    },
    {
      h: "4. Üyeler arası davranış",
      p: [
        "İletişim nazik olmalıdır. Taciz, nefret söylemi, ayrımcı veya tehditkâr ifadeler hesabın derhal askıya alınmasına yol açar.",
        "Mesajlaşmayı reklam amacıyla ya da platform dışında ödeme istemek için kullanmak yasaktır.",
      ],
    },
    {
      h: "5. Buluşma ve güvenlik",
      p: [
        "Yüz yüze buluşmalar tamamen sizin sorumluluğunuzdadır. Kalabalık ve halka açık yerleri tercih etmenizi, güven oluşmadan açık adresinizi paylaşmamanızı öneririz.",
        "Site hiçbir üyenin açık adresini göstermez; yalnızca yaklaşık bir mesafe belirtilir.",
      ],
    },
    {
      h: "6. İşlemler",
      p: [
        "Fiyat, teslim şekli ve ödeme üyeler arasında serbestçe kararlaştırılır. Bugün itibarıyla site üzerinden ödeme işlenmemektedir.",
        "Ödünç ve kiralamada kararlaştırılan iade tarihi alanı bağlar. Anlaşmazlık hâlinde üyeler işlemi bildirebilir; Voisini denetim yapabilir ancak hakemlik etmez ve hiçbir mali sorumluluk üstlenmez.",
      ],
    },
    {
      h: "7. Değerlendirmeler",
      p: [
        "Puan yalnızca iki tarafın da onayladığı bir işlemden sonra verilebilir. Değerlendirmeler gerçek bir deneyimi yansıtmalıdır; sahte yorumlar hesabın silinmesine yol açar.",
      ],
    },
    {
      h: "8. Askıya alma ve sona erdirme",
      p: [
        "Hesabınızı profil sayfanızdan istediğiniz zaman silebilirsiniz.",
        "Voisini, bu şartlara aykırılık, tehlikeli davranış veya dolandırıcılık hâlinde hesabı askıya alabilir ya da silebilir.",
      ],
    },
    {
      h: "9. Sorumluluk",
      p: [
        "Hizmet olduğu gibi sunulur; kesintisiz erişim garanti edilemez.",
        "Üyeler arasındaki anlaşmalardan, değiş tokuş edilen eşyaların durumundan veya kullanıcı davranışlarından doğan zararlardan yayıncı sorumlu tutulamaz.",
      ],
    },
    {
      h: "10. Şartların değişmesi",
      p: [
        "Bu şartlar değişebilir. Esaslı bir değişiklik hâlinde üyeler e-posta ile veya bir sonraki girişlerinde bilgilendirilir.",
      ],
    },
    {
      h: "11. Uygulanacak hukuk",
      p: [
        "Bu şartlar Fransız hukukuna tabidir. Anlaşmazlık hâlinde önce dostane çözüm aranır; aksi hâlde Fransız mahkemeleri yetkilidir.",
        "Fransız tüketici kanununun L.612-1 maddesi uyarınca ücretsiz olarak bir tüketici arabulucusuna başvurabilirsiniz.",
      ],
    },
  ],
};

export const privacy: LegalDoc = {
  slug: "privacy",
  title: "Gizlilik politikası",
  intro:
    "Bu metin, Voisini'nin hangi kişisel verileri neden topladığını, ne kadar süre sakladığını ve haklarınızı nasıl kullanacağınızı Avrupa Genel Veri Koruma Tüzüğü (GDPR) uyarınca açıklar.",
  sections: [
    {
      h: "Veri sorumlusu",
      p: [
        `${PUBLISHER.name} — ${PUBLISHER.email}`,
        "Verilerinizle ilgili her soru için bu adrese yazabilirsiniz. En geç bir ay içinde yanıt verilir.",
      ],
    },
    {
      h: "Toplanan veriler",
      p: [
        "Hesap: e-posta adresi, görünen ad, şifre (yalnızca şifrelenmiş biçimde saklanır, hiçbir zaman açık metin olarak değil), eklediyseniz profil fotoğrafı.",
        "Konum: kendi girdiğiniz şehir ve yaklaşık konum. Kesin konumunuz hiçbir zaman istenmez ve gösterilmez: koordinatlar kaydedilmeden önce bilerek kaydırılır ve diğer üyelere yalnızca yaklaşık mesafe gösterilir.",
        "İlanlar: yayımladığınız eşyanın başlığı, açıklaması, fotoğrafları, fiyatı, kategorisi ve durumu.",
        "Mesajlar: diğer üyelerle yaptığınız yazışmaların içeriği.",
        "Teknik: IP adresi ve bağlantı tarihleri; güvenlik ve kötüye kullanımla mücadele için saklanır.",
      ],
    },
    {
      h: "Amaçlar ve hukuki dayanaklar",
      p: [
        "Hizmeti sunmak (hesap, ilanlar, mesajlaşma, işlemler) — sözleşmenin ifası.",
        "Güvenliği sağlamak, dolandırıcılığı önlemek ve içerikleri denetlemek — meşru menfaat.",
        "Etkinliğinizle ilgili e-postalar göndermek (yeni mesaj, talep kabulü, iade hatırlatması) — sözleşmenin ifası; bu gönderimler profilinizden kapatılabilir.",
        "Yasal yükümlülüklere uymak, özellikle bağlantı kayıtlarının saklanması.",
      ],
    },
    {
      h: "Saklama süreleri",
      p: [
        "Hesap ve ilanlar: hesap etkin olduğu sürece, silindikten sonra 30 gün.",
        "Mesajlar: yazışma var olduğu sürece; hesapla birlikte silinir.",
        "Bağlantı kayıtları: Fransız mevzuatı uyarınca 12 ay.",
        "Şikayetler ve denetim kararları: ispat amacıyla 3 yıl.",
      ],
    },
    {
      h: "Verilerin paylaşıldığı taraflar",
      p: [
        "Verileriniz satılmaz, kiralanmaz ve reklam amacıyla aktarılmaz.",
        "Talimatlarımızla hareket eden şu teknik hizmet sağlayıcılar tarafından işlenir:",
        ...processors,
        "Bu sağlayıcıların bir kısmı Amerika Birleşik Devletleri'nde kuruludur; olası aktarımlar Avrupa Komisyonu'nun standart sözleşme hükümleriyle güvence altındadır.",
      ],
    },
    {
      h: "Diğer üyelerin gördüğü bilgiler",
      p: [
        "Görünen adınız, profil fotoğrafınız, ilanlarınız, ortalama puanınız ve yaklaşık bir mesafe.",
        "Hiçbir zaman görünmez: e-posta adresiniz, posta adresiniz, kesin konumunuz, telefon numaranız.",
      ],
    },
    {
      h: "Haklarınız",
      p: [
        "Verilerinize erişme, düzeltme, silme, işlemeyi kısıtlama, itiraz etme ve taşınabilirlik haklarına sahipsiniz.",
        `Bu hakları profil sayfanızdan veya ${PUBLISHER.email} adresine yazarak kullanabilirsiniz.`,
        "Haklarınızın karşılanmadığını düşünüyorsanız Fransız veri koruma kurumu CNIL'e (cnil.fr) başvurabilirsiniz.",
      ],
    },
    {
      h: "Güvenlik",
      p: [
        "Site ile tüm iletişim şifrelidir (HTTPS). Şifreler geri döndürülemez biçimde saklanır. Veritabanı düzeyindeki erişim kuralları sayesinde bir üye yalnızca kendisini ilgilendiren kayıtları okuyabilir.",
        "Haklarınız açısından risk doğurabilecek bir veri ihlali hâlinde GDPR 34. madde uyarınca bilgilendirilirsiniz.",
      ],
    },
    {
      h: "Küçükler",
      p: [
        "Hizmet yalnızca 18 yaşını doldurmuş kişilere yöneliktir. Küçüklere ait olduğu tespit edilen hesaplar silinir.",
      ],
    },
  ],
};

export const cookies: LegalDoc = {
  slug: "cookies",
  title: "Çerezler",
  intro:
    "Voisini hiçbir reklam çerezi veya kişiye bağlı ölçümleme izleyicisi kullanmaz. Bu nedenle onay bandına gerek yoktur.",
  sections: [
    {
      h: "Cihazınızda tutulanlar",
      p: [
        "Oturum çerezleri (vsi-at, vsi-rt): girişte kalmanız için zorunludur. Sayfa koduna kapalıdır, yalnızca HTTPS üzerinden iletilir, çıkış yapınca veya oturum sona erince silinir.",
        "Yerel depolama (vsi-theme): açık/koyu görünüm tercihinizi hatırlar. Bu bilgi tarayıcınızda kalır, bize hiç iletilmez.",
      ],
    },
    {
      h: "Neden onay bandı yok",
      p: [
        "Avrupa mevzuatı yalnızca kesinlikle gerekli olmayan izleyiciler için onay şartı arar. Yukarıdakiler talep ettiğiniz hizmetin çalışması için zorunlu olduğundan bu şarttan muaftır.",
        "İleride bir ziyaretçi ölçümleme aracı eklenirse, çerez ve kişisel tanımlayıcı kullanmayan bir araç seçilecek ya da onay bandı konulacaktır.",
      ],
    },
    {
      h: "Silme",
      p: [
        "Bunları tarayıcı ayarlarınızdan istediğiniz zaman temizleyebilirsiniz. Çıkış yapmak oturum çerezlerini anında siler.",
      ],
    },
  ],
};

export const legalTr = { mentions, terms, privacy, cookies };
