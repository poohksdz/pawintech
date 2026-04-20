import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useGetAboutDetailsQuery } from "../slices/aboutApiSlice";
import DOMPurify from "dompurify";
import {
  FaMicrochip,
  FaRocket,
  FaShieldAlt,
  FaEdit,
  FaServer,
  FaCogs,
  FaUsers,
} from "react-icons/fa";
import TrackVisibility from "react-on-screen";

const AboutScreen = () => {
  const aboutId = "1";
  const { language } = useSelector((state) => state.language);
  // We still fetch in case the user eventually uses the admin panel to update
  const { data: about, refetch } = useGetAboutDetailsQuery(aboutId);

  useEffect(() => {
    refetch();
  }, [about, refetch]);

  const content = about
    ? language === "thai"
      ? about.aboutContentThai
      : about.aboutContentEng
    : "";
  const sanitizedContent = DOMPurify.sanitize(content || "", {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allowfullscreen", "frameborder", "src", "class"],
  });

  const processContent = (html) => {
    if (!html) return "";
    return html
      .replace(/src="(aboutImages\/.*?)"/g, 'src="/$1"')
      .replace(
        /<img /g,
        '<img class="w-full h-auto rounded-3xl shadow-xl my-8 object-cover object-center max-h-[500px]" ',
      )
      .replace(
        /<iframe /g,
        '<iframe class="w-full max-w-4xl aspect-video rounded-3xl shadow-xl my-8 mx-auto" ',
      )
      .replace(
        /https:\/\/www\.youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/g,
        '<iframe class="ql-video aspect-[9/16] max-w-sm rounded-3xl shadow-xl mx-auto my-8" frameborder="0" allowfullscreen="true" src="https://www.youtube.com/embed/$1"></iframe>',
      );
  };

  let processedContent = processContent(sanitizedContent);

  const fallbackOverviewEn = `
    <h3>Who We Are</h3>
    <p><strong>Pawin Technology Co., Ltd.</strong> is a leading electronic manufacturing services (EMS) provider based in Bangkok, Thailand. We specialize in transforming complex engineering ideas into reality through state-of-the-art PCB design, cloning, component sourcing, and high-precision PCBA manufacturing.</p>
    
    <h3>Our Mission</h3>
    <p>Our mission is to empower hardware innovators, startups, and established enterprises by providing a seamless, end-to-end manufacturing ecosystem. We pride ourselves on reducing time-to-market without compromising on strict quality controls.</p>
    
    <img src="https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1200&q=80" alt="Engineers working" />
    
    <h3>Why Choose Us?</h3>
    <ul>
      <li><strong>Total Solution:</strong> From the initial schematic logic to the final boxed product, we handle every step of the supply chain.</li>
      <li><strong>Global Sourcing Network:</strong> Our deep connections allow us to source authentic tier-1 components quickly and at the best possible pricing.</li>
      <li><strong>Rigorous Quality Control:</strong> Every board undergoes automated optical inspection (AOI) and comprehensive functional testing before delivery.</li>
      <li><strong>Dedicated Expertise:</strong> Our locally based team of engineers is ready to provide immediate DFM (Design For Manufacturability) support and troubleshooting.</li>
    </ul>
  `;

  const fallbackOverviewTh = `
    <h3>ความเป็นมาของเรา</h3>
    <p><strong>บริษัท ภาวินท์เทคโนโลยี จำกัด</strong> คือผู้ให้บริการด้านการผลิตและประกอบอุปกรณ์อิเล็กทรอนิกส์ (EMS) ระดับแนวหน้าในกรุงเทพมหานคร เรามีความเชี่ยวชาญในการเปลี่ยนไอเดียทางวิศวกรรมที่ซับซ้อนให้กลายเป็นผลิตภัณฑ์จริง ผ่านบริการออกแบบ PCB, บริการคัดลอกวงจร (Clone), การจัดหาอะไหล่ และการประกอบ PCBA ที่มีความแม่นยำสูง</p>
    
    <h3>เป้าหมายของเรา</h3>
    <p>ภารกิจหลักของเราคือการสนับสนุนนักประดิษฐ์ฮาร์ดแวร์, สตาร์ทอัพ และบริษัทชั้นนำ ทั้งในและต่างประเทศ ด้วยระบบนิเวศการผลิตแบบครบวงจร เรามุ่งมั่นที่จะช่วยลดเวลาในการออกสู่ตลาดของผลิตภัณฑ์ (Time-to-market) โดยยังคงรักษามาตรฐานการควบคุมคุณภาพที่เข้มงวดที่สุด</p>
    
    <img src="https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1200&q=80" alt="ทีมวิศวกรทำงาน" />
    
    <h3>ทำไมถึงต้องเลือกเรา?</h3>
    <ul>
      <li><strong>บริการครบวงจร (Total Solution):</strong> ตั้งแต่การวาดวงจรเริ่มต้น (Schematic) ไปจนถึงการประกอบชิ้นงานสำเร็จรูป เราจัดการทุกขั้นตอนของซัพพลายเชน</li>
      <li><strong>เครือข่ายจัดหาอะไหล่ระดับโลก:</strong> เรามีเครือข่ายที่เชี่ยวชาญในการจัดหาชิ้นส่วนแท้ (Tier-1) ได้อย่างรวดเร็ว และได้ราคาที่คุ้มค่าที่สุด</li>
      <li><strong>การตรวจสอบคุณภาพที่เข้มงวด:</strong> บอร์ดทุกชิ้นต้องผ่านการตรวจสอบด้วยระบบแสงอัตโนมัติ (AOI) และการทดสอบฟังก์ชันแบบครบวงจรก่อนส่งมอบ</li>
      <li><strong>ทีมวิศวกรผู้เชี่ยวชาญ:</strong> ทีมวิศวกรในพื้นที่ของเราพร้อมให้คำปรึกษาด้านการออกแบบเพื่อการผลิต (DFM) และช่วยแก้ไขปัญหาทางเทคนิคอย่างรวดเร็ว</li>
    </ul>
  `;

  if (!processedContent || processedContent.trim().length === 0) {
    processedContent =
      language === "thai"
        ? processContent(fallbackOverviewTh)
        : processContent(fallbackOverviewEn);
  }

  const t = {
    en: {
      heroTitle: "Expert End-to-End PCB Solutions",
      heroSubtitle:
        "Pawin Technology Co., Ltd. is committed to providing excellent electronic manufacturing services, from PCB design and component sourcing to high-standard PCBA assembly.",
      stats: [
        { label: "Satisfied Clients", value: "100+" },
        { label: "Successful Projects", value: "500+" },
        { label: "Quality Assurance", value: "100%" },
      ],
      valuesTitle: "Our Comprehensive Services",
      values: [
        {
          icon: <FaMicrochip />,
          title: "PCB & Product Design",
          desc: "Professional schematic and layout design services tailored to your specific product requirements.",
        },
        {
          icon: <FaRocket />,
          title: "PCB Clone Service",
          desc: "High-precision PCB cloning and reverse engineering to restore or upgrade legacy systems.",
        },
        {
          icon: <FaServer />,
          title: "Component Sourcing",
          desc: "Reliable global procurement of electronic components, ensuring authentic parts at optimal pricing.",
        },
        {
          icon: <FaCogs />,
          title: "PCBA Manufacturing",
          desc: "State-of-the-art Surface Mount Technology (SMT) and through-hole assembly services.",
        },
        {
          icon: <FaShieldAlt />,
          title: "Testing & Inspection",
          desc: "Rigorous quality control, functional testing, and inspection at every manufacturing stage.",
        },
        {
          icon: <FaUsers />,
          title: "Expert Consultation",
          desc: "Personalized consulting and deep-dive analysis for Bill of Materials (BOM) and risk mitigation.",
        },
      ],
      editButton: "Edit Database Content",
    },
    thai: {
      heroTitle: "ผู้เชี่ยวชาญการผลิตและออกแบบ PCB ครบวงจร",
      heroSubtitle:
        "บริษัท ภาวินท์เทคโนโลยี จำกัด มุ่งมั่นให้บริการด้านอิเล็กทรอนิกส์ด้วยโซลูชันที่ทันสมัย ตั้งแต่การออกแบบ จัดหาอุปกรณ์ ไปจนถึงการประกอบ PCBA ที่ได้มาตรฐานสูงสุด",
      stats: [
        { label: "ลูกค้าที่ไว้วางใจ", value: "100+" },
        { label: "โปรเจกต์ที่สำเร็จ", value: "500+" },
        { label: "รับประกันคุณภาพ", value: "100%" },
      ],
      valuesTitle: "บริการแบบครบวงจรของเรา",
      values: [
        {
          icon: <FaMicrochip />,
          title: "ออกแบบ PCB และผลิตภัณฑ์",
          desc: "บริการออกแบบวงจรและจัดวาง Layout ระดับมืออาชีพ ปรับแต่งให้ตรงกับความต้องการเฉพาะของคุณ",
        },
        {
          icon: <FaRocket />,
          title: "บริการคัดลอกวงจร (Clone)",
          desc: "วิศวกรรมย้อนกลับและคัดลอกแผ่น PCB ด้วยความแม่นยำสูง เพื่อซ่อมบำรุงหรืออัปเกรดระบบเดิม",
        },
        {
          icon: <FaServer />,
          title: "จัดหาอุปกรณ์อิเล็กทรอนิกส์",
          desc: "จัดหาชิ้นส่วนและอะไหล่จากเครือข่ายระดับโลก มั่นใจได้ในของแท้และราคาที่เหมาะสม",
        },
        {
          icon: <FaCogs />,
          title: "ประกอบแผงวงจร (PCBA)",
          desc: "บริการประกอบ SMT และ Through-hole ด้วยเครื่องจักรที่ทันสมัย รองรับการผลิตทุกระดับ",
        },
        {
          icon: <FaShieldAlt />,
          title: "ทดสอบและตรวจสอบวงจร",
          desc: "ผ่านการทดสอบฟังก์ชันและควบคุมคุณภาพอย่างเข้มงวดในทุกขั้นตอนการผลิต",
        },
        {
          icon: <FaUsers />,
          title: "บริการให้คำปรึกษา",
          desc: "วิเคราะห์ความเสี่ยง BOM ประเมินอุปกรณ์ที่ล้าสมัย และให้คำปรึกษาด้านเส้นทางวิกฤตของโปรดักส์",
        },
      ],
      editButton: "แก้ไขเนื้อหา Database",
    },
  }[language || "en"];

  return (
    <div className="bg-slate-50 dark:bg-black min-h-screen font-sans pb-40 transition-colors duration-500">
      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-40 lg:pt-40 lg:pb-48 overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          {/* Abstract grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4NiIgaGVpZ2h0PSI4NiI+Cgk8cmVjdCB3aWR0aD0iODYiIGhlaWdodD0iODYiIGZpbGw9Im5vbmUiIC8+Cgk8cGF0aCBkPSJNOTEgMjVMNjcgNDl2NDloMjRWMjV6IiBmaWxsPSIjMWUxZTFlIiBmaWxsLW9wYWNpdHk9IjAuMDIiIC8+Cgk8cGF0aCBkPSJNNjcgNDlMMzkgMTVWLTloNHYyNGwyNCAyNHY0OWhfNHYtNDl6IiBmaWxsPSIjMWUxZTFlIiBmaWxsLW9wYWNpdHk9IjAuMDQiIC8+Cgk8cGF0aCBkPSJNMzkgMTVMOSA0NXY0OUgtdi00OUwzMSAxNWgyNHYyNGgtMnYtMjJ6IiBmaWxsPSIjMWUxZTFlIiBmaWxsLW9wYWNpdHk9IjAuMDMiIC8+Cgk8cGF0aCBkPSJNOSA0NUwtMjkgMTVWLTloMnYyMmwzMCAzMHY0OWgtMnYtNDl6IiBmaWxsPSIjMWUxZTFlIiBmaWxsLW9wYWNpdHk9IjAuMDUiIC8+Cjwvc3ZnPg==')] opacity-30 mix-blend-overlay"></div>
          {/* Glow Orbs */}
          <div className="absolute -top-[20%] -right-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-blue-600/30 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-emerald-500/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 lg:px-8 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-md mb-8 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">
              About PAWIN Technology
            </span>
          </div>

          <TrackVisibility once partialVisibility>
            {({ isVisible }) => (
              <div
                className={`transition-all duration-1000 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
              >
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-[1.05] bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-slate-500">
                  {t.heroTitle}
                </h1>
                <p className="text-lg md:text-2xl text-slate-400 text-center max-w-3xl mx-auto leading-relaxed font-light">
                  {t.heroSubtitle}
                </p>
              </div>
            )}
          </TrackVisibility>
        </div>
      </section>

      {/* 2. Overlapping Stats Bar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-20 md:-mt-24 mb-32">
        <div className="bg-white dark:bg-black rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100/60 dark:border-zinc-800/60 p-4 md:p-8 md:p-14 overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-black transition-colors duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 transition-colors duration-500">
            {t.stats.map((stat, i) => (
              <div
                key={i}
                className={`pt-8 md:pt-0 ${i === 0 ? "pt-0" : ""} flex flex-col items-center justify-center group`}
              >
                <div className="text-5xl md:text-6xl font-black mb-2 tracking-tight text-slate-900 dark:text-white group-hover:scale-105 transition-all duration-300">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Core Values Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight transition-colors duration-500">
            {t.valuesTitle}
          </h2>
          <div className="w-16 h-1.5 bg-blue-600 rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 md:gap-8">
          {t.values.map((v, i) => (
            <TrackVisibility once partialVisibility key={i}>
              {({ isVisible }) => (
                <div
                  className={`bg-white dark:bg-black rounded-3xl p-4 md:p-8 hover:bg-slate-900 dark:hover:bg-slate-800 hover:-translate-y-2 group transition-all duration-500 shadow-sm border border-slate-100 dark:border-zinc-800 hover:shadow-2xl h-full flex flex-col ${isVisible ? "animate-[slideUpFade_0.8s_ease-out_forwards]" : "opacity-0"}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 group-hover:bg-blue-600/20 group-hover:text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-8 transition-colors duration-500">
                    {v.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-white mb-4 transition-colors duration-500">
                    {v.title}
                  </h3>
                  <p className="text-slate-500 group-hover:text-slate-400 leading-relaxed font-medium transition-colors duration-500">
                    {v.desc}
                  </p>
                </div>
              )}
            </TrackVisibility>
          ))}
        </div>
      </section>

      {/* 4. Company Overview Area */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-500">
              Company Overview
            </h2>
          </div>

          {about && (
            <Link
              to={`/admin/about/${aboutId}/edit`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <FaEdit /> {t.editButton}
            </Link>
          )}
        </div>

        <div className="bg-white dark:bg-black p-4 md:p-8 sm:p-12 md:p-16 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-zinc-800 min-h-[300px] flex flex-col justify-center transition-colors duration-500">
          <div
            className="prose prose-lg md:prose-xl prose-slate dark:prose-invert max-w-none transition-colors duration-500
                          prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:tracking-tight
                          prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-loose
                          prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-700 dark:hover:prose-a:text-blue-300 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                          prose-ul:text-slate-600 dark:prose-ul:text-slate-300 prose-li:marker:text-blue-500
                          prose-strong:text-slate-800 dark:prose-strong:text-slate-200"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </div>
      </section>
    </div>
  );
};

export default AboutScreen;
