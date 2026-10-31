<div dir="rtl">

# یادگیری آخر هفته

درس‌های خبرنامه‌ی «یادگیری آخر هفته» در این مخزن است. این خبرنامه خواهر فارسی خبرنامه‌ی انگلیسی‌ام Weekend Learning است و هر دو هفته یک بار، جمعه‌ها، یک مفهوم پایه از یادگیری ماشین و مدل‌های زبانی را ساده و به فارسی توضیح می‌دهد. هر درس تمرینی هم دارد که نه نصب برنامه می‌خواهد و نه فیلترشکن.

من هادی محمدی هستم. دکترایم را در پردازش زبان طبیعی و هوش مصنوعی توضیح‌پذیر از دانشگاه اوترخت گرفته‌ام و در هلند روی هوش مصنوعی و علم داده کار می‌کنم.

درس‌ها را می‌توانید در [وب‌سایت یادگیری آخر هفته](https://mohammadi.cv/weekend-learning-fa/) بخوانید یا فایل زیپ هر درس را بگیرید و صفحه‌اش را در مرورگر باز کنید.

## هر درس را به چهار شکل می‌شود دنبال کرد

هر درس پوشه‌ی خودش را دارد، مثلاً `01-next-word` برای درس اول. این چهار شکل برای همه‌ی درس‌ها یکی است:

- **بخوانید:** صفحه‌ی درس همان متن شماره‌ی خبرنامه را دارد.
- **بازی کنید:** در همان صفحه ابزار کوچکی هست که با داده‌های همان درس کار می‌کند.
- **اجرا کنید:** هر درس یک دفترچه‌ی ژوپیتر (Jupyter notebook) دارد که فقط از خود پایتون (Python) استفاده می‌کند و به هیچ بسته‌ی دیگری نیاز ندارد.
- **با خود ببرید:** فایل زیپ کل پوشه‌ی درس را یک بار بگیرید؛ بعد از آن، صفحه و ابزار و دفترچه بدون اینترنت هم کار می‌کنند.

ویدیو بعداً اضافه می‌شود. صفحه‌ها را طوری ساخته‌ام که با اینترنت کند و گران هم باز شوند: هیچ چیزی از سرور دیگری بارگذاری نمی‌شود و فونت وزیرمتن (Vazirmatn) همراه خود صفحه‌هاست. اگر وب‌سایت باز نشد، کل مخزن را از همین صفحه‌ی گیت‌هاب بگیرید: دکمه‌ی سبز Code و بعد Download ZIP.

## درس‌ها

- [درس ۱: حدس کلمه‌ی بعدی](01-next-word/) نشان می‌دهد که مدل زبانی فقط کلمه‌ی بعدی را حدس می‌زند، همان کاری که شما با ضرب‌المثل‌ها می‌کنید.
- [درس ۲: تکه‌هایی به اسم توکن](02-tokens/) نشان می‌دهد که مدل متن را تکه‌تکه می‌خواند و چرا همان جمله به فارسی تکه‌های بیشتری از انگلیسی می‌خواهد.
- [درس ۳: عددهایی به اسم پارامتر](03-parameters/) نشان می‌دهد که مدل فرمولی با چند عدد قابل تنظیم است و یادگیری یعنی پیدا کردن همین عددها از روی مثال‌ها.
- [درس ۴: فارسی، زبانی کم‌منبع](04-low-resource/) نشان می‌دهد که در متن‌هایی که مدل‌ها از آن‌ها یاد می‌گیرند فارسی کم است و چرا به چنین زبانی کم‌منبع می‌گویند.

## دفترچه بدون اینترنت هم اجرا می‌شود

برای اجرای دفترچه فقط پایتون ۳ لازم است. فایل زیپ درس را از حالت فشرده خارج کنید. بعد در ترمینال به پوشه‌ی درس بروید:

<div dir="ltr">

```sh
cd 01-next-word
```

</div>

اگر ژوپیتر روی کامپیوترتان نصب است، این دستور را بزنید و در مرورگر فایلی را که پسوند `ipynb` دارد باز کنید:

<div dir="ltr">

```sh
jupyter lab
```

</div>

اگر ژوپیتر ندارید، خود پایتون کافی است. این دستور سلول‌های کد دفترچه را به ترتیب اجرا می‌کند و هر چه دفترچه چاپ کند در ترمینال می‌آید:

<div dir="ltr">

```sh
python3 -c "import glob,json; nb=json.load(open(glob.glob('*.ipynb')[0],encoding='utf-8')); exec('\n'.join(''.join(c['source']) for c in nb['cells'] if c['cell_type']=='code'))"
```

</div>

در ویندوز به جای `python3` فقط `python` بنویسید.

## خبرنامه در لینکدین منتشر می‌شود

خبرنامه‌ی «یادگیری آخر هفته» را در [صفحه‌اش در لینکدین](https://www.linkedin.com/newsletters/7508807306889863168/) دنبال کنید. متن هر درس همان متن شماره‌ای است که درس از آن ساخته شده؛ اگر لینکدین برایتان باز نمی‌شود، همین‌جا بخوانید. خبرنامه‌ی انگلیسی‌ام [Weekend Learning](https://www.linkedin.com/newsletters/weekend-learning-7044258763238731776/) درباره‌ی ارزیابی مدل‌هاست و در هفته‌هایی می‌آید که این یکی نمی‌آید. بقیه‌ی نوشته‌هایم [در وب‌سایتم](https://mohammadi.cv/) هست.

## عددهای مدل از یک اجرای واقعی می‌آیند

هر عددی که از مدل در درس‌ها می‌بینید از فایلی می‌آید که نتیجه‌ی یک اجرای واقعی در آن ثبت شده. برای درس اول، مدل را روی لپ‌تاپ خودم و بدون اینترنت اجرا کرده‌ام. گزیده‌ای از همان فایل در پوشه‌ی هر درس هست تا خودتان عددها را با متن مقایسه کنید. عددهای درس چهارم از جدول‌هایی می‌آیند که کامن‌کرال و اوپن‌ای‌آی منتشر کرده‌اند و نشانی هر جدول در فایل `data.json` همان درس هست. اگر جایی جور نبود، در بخش Issues همین مخزن بنویسید.

## مجوزها

- متن درس‌ها و شکل‌ها با مجوز [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) آزاد است. می‌توانید آن‌ها را بازنشر کنید، ترجمه کنید یا در کلاس به کار ببرید؛ فقط نام نویسنده و پیوند مجوز را بیاورید و بگویید چه چیزی را تغییر داده‌اید. جزئیات در فایل `LICENSE-CONTENT` است.
- کد ابزارها و دفترچه‌ها با مجوز MIT است و متن مجوز در فایل `LICENSE` هست.
- فونت وزیرمتن را صابر راستی‌کردار و دیگر سازندگان پروژه‌ی وزیرمتن ساخته‌اند و با مجوز SIL Open Font License منتشر شده. خود فونت و فایل مجوزش کنار هم در پوشه‌ی `assets/fonts/` هستند.

</div>

## In English

This repository is the home of یادگیری آخر هفته, a series of short lessons that explain one machine learning idea at a time to Persian-speaking beginners. Many readers are in Iran on slow and expensive connections, so every lesson works offline once downloaded. Each one has a page to read, a small in-page tool running on the lesson's own data (measured, taken from published statistics, or invented and labelled as such), a Jupyter notebook that needs nothing beyond the Python standard library, and a zip of the whole folder. The pages load nothing from other servers; even the Vazirmatn font ships with them.

It is the Persian sibling of [Weekend Learning](https://www.linkedin.com/newsletters/weekend-learning-7044258763238731776/), my English newsletter on evaluating language models, and the two come out in alternate weeks. Each lesson starts from an issue of the Persian newsletter on [LinkedIn](https://www.linkedin.com/newsletters/7508807306889863168/). The lessons are online at [mohammadi.cv/weekend-learning-fa](https://mohammadi.cv/weekend-learning-fa/), and the rest of my work is at [mohammadi.cv](https://mohammadi.cv). Code is under the MIT licence, lesson text and figures under CC BY 4.0, and the Vazirmatn font under the SIL Open Font License.
