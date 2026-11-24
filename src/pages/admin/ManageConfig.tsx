import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, ExternalLink } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { apiFetch } from '../../utils/api';
import { ImageUploadField } from '../../components/admin/ImageUploadField';

/** 导航可用图标（与前台 Navbar 的图标表一致） */
const NAV_ICONS: [string, string][] = [
  ['Home', '主页'], ['GraduationCap', '教程'], ['FlaskConical', '实验室'], ['Waypoints', '知识图谱'],
  ['Bot', '机器人'], ['Archive', '归档'], ['FileText', '文档'], ['User', '用户'], ['Route', '路线'],
];

const FIELD = 'w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors';
const ROW_FIELD = 'w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors';
const ROW_LABEL = 'text-xs font-medium text-text-secondary';
const ROW_REMOVE = 'p-2 text-sm text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0';
const ADD_BTN = 'text-sm text-accent hover:text-accent-hover font-medium';
const SECTION = 'bg-bg-card border border-border rounded-2xl p-6 shadow-sm';
const EMPTY = 'text-sm text-text-secondary text-center py-4';

export const ManageConfig: React.FC = () => {
  const { config, refreshData } = useData();
  const [formData, setFormData] = useState(config || {} as any);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleStatsChange = (field: string, value: any) => handleChange('stats', field, value);
  const handleProfileChange = (field: string, value: any) => handleChange('profile', field, value);
  const handleHeroChange = (field: string, value: any) => handleChange('hero', field, value);
  const handleThemeChange = (field: string, value: any) => handleChange('theme', field, value);
  const handlePetChange = (patch: Record<string, any>) =>
    handleThemeChange('pet', { ...(formData.theme?.pet || {}), ...patch });
  const handleFooterChange = (field: string, value: any) => handleChange('footer', field, value);
  const handleAboutChange = (field: string, value: any) => handleChange('about', field, value);

  const handleAboutSkillsChange = (index: number, value: string) => {
    setFormData((prev: any) => {
      const newSkills = [...(prev.about?.skills || [])];
      newSkills[index] = value;
      return {
        ...prev,
        about: {
          ...prev.about,
          skills: newSkills
        }
      };
    });
  };

  const addAboutSkill = () => {
    setFormData((prev: any) => ({
      ...prev,
      about: {
        ...prev.about,
        skills: [...(prev.about?.skills || []), '']
      }
    }));
  };

  const removeAboutSkill = (index: number) => {
    setFormData((prev: any) => {
      const newSkills = [...(prev.about?.skills || [])];
      newSkills.splice(index, 1);
      return {
        ...prev,
        about: {
          ...prev.about,
          skills: newSkills
        }
      };
    });
  };

  const handleSocialChange = (index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      const newSocial = [...(prev.social || [])];
      newSocial[index] = { ...newSocial[index], [field]: value };
      return { ...prev, social: newSocial };
    });
  };

  const addSocial = () => {
    setFormData((prev: any) => ({
      ...prev,
      social: [...(prev.social || []), { platform: '', url: '' }]
    }));
  };

  const removeSocial = (index: number) => {
    setFormData((prev: any) => {
      const newSocial = [...(prev.social || [])];
      newSocial.splice(index, 1);
      return { ...prev, social: newSocial };
    });
  };

  const updateFriend = (index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      const newFriends = [...(prev.friends || [])];
      newFriends[index] = { ...newFriends[index], [field]: value };
      return { ...prev, friends: newFriends };
    });
  };

  const updateNav = (index: number, patch: Record<string, any>) => {
    setFormData((prev: any) => {
      const newNav = [...(prev.nav || [])];
      newNav[index] = { ...newNav[index], ...patch };
      return { ...prev, nav: newNav };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch('/api/config', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await refreshData();
        alert('设置已保存');
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('保存失败，请检查服务是否正常');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-text-primary">站点设置</h1>
          <p className="text-text-secondary">标题、横幅、主题外观、导航与页脚等全局配置；保存后刷新前台生效。</p>
        </div>
        <button
          type="submit"
          form="site-config-form"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium shadow-sm disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? '保存中…' : '保存设置'}
        </button>
      </header>

      <form id="site-config-form" onSubmit={handleSubmit} className="flex flex-col gap-8">

        {/* 基本信息 */}
        <section className={SECTION}>
          <h2 className="mb-6 text-xl font-bold text-text-primary">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">站点域名</label>
              <input
                type="text"
                value={formData.domain || ''}
                onChange={e => handleChange('', 'domain', e.target.value)}
                placeholder="blog.wineryz.top"
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">作者名</label>
              <input
                type="text"
                value={formData.author || ''}
                onChange={e => handleChange('', 'author', e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-text-primary">站点标题</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={e => handleChange('', 'title', e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-text-primary">站点副标题</label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={e => handleChange('', 'subtitle', e.target.value)}
                className={FIELD}
              />
            </div>
          </div>
        </section>

        {/* 首页横幅 */}
        <section className={SECTION}>
          <h2 className="mb-6 text-xl font-bold text-text-primary">首页横幅</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">横幅标题（打字机逐字显示）</label>
              <input
                type="text"
                value={formData.hero?.title || ''}
                onChange={e => handleHeroChange('title', e.target.value)}
                className={FIELD}
              />
              <p className="text-xs text-text-muted">建议 14–24 个字，过长会在窄屏折成多行</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">横幅副标题</label>
              <input
                type="text"
                value={formData.hero?.subtitle || ''}
                onChange={e => handleHeroChange('subtitle', e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <ImageUploadField
                label="背景图片"
                value={formData.hero?.image || ''}
                onChange={url => handleHeroChange('image', url)}
                preview="wide"
                hint="首页顶部横幅背景，支持上传或填写站内路径（建议 1920×600 以上）；留空使用默认的胡桃横幅"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">图片署名</label>
              <input
                type="text"
                value={formData.hero?.credit || ''}
                onChange={e => handleHeroChange('credit', e.target.value)}
                placeholder="留空则不显示"
                className={FIELD}
              />
            </div>
          </div>
        </section>

        {/* 个人资料 */}
        <section className={SECTION}>
          <h2 className="mb-6 text-xl font-bold text-text-primary">个人资料</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">昵称</label>
              <input
                type="text"
                value={formData.profile?.name || ''}
                onChange={e => handleProfileChange('name', e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">个人简介</label>
              <input
                type="text"
                value={formData.profile?.bio || ''}
                onChange={e => handleProfileChange('bio', e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <ImageUploadField
                label="头像"
                value={formData.profile?.avatar || ''}
                onChange={url => handleProfileChange('avatar', url)}
                preview="square"
                hint="显示在侧边栏个人卡片、AI 馆员与关于页（建议正方形图片）"
              />
            </div>
          </div>
        </section>

        {/* 统计 */}
        <section className={SECTION}>
          <h2 className="mb-4 text-xl font-bold text-text-primary">站点统计</h2>
          <p className="mb-5 text-sm text-text-secondary">
            文章数、分类数、标签数、总字数与最近更新日期都由系统按文章数据实时统计，无需手动维护。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">建站天数（可选）</label>
              <input
                type="number"
                min="0"
                value={formData.stats?.runningDays || 0}
                onChange={e => handleStatsChange('runningDays', Math.max(0, parseInt(e.target.value) || 0))}
                className={FIELD}
              />
              <p className="text-xs text-text-muted">填 0 表示不在前台显示这一项</p>
            </div>
          </div>
        </section>

        {/* 主题与外观 */}
        <section className={SECTION}>
          <h2 className="mb-6 text-xl font-bold text-text-primary">主题与外观</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">默认强调色</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.theme?.accentColor || '#F27D26'}
                  onChange={e => handleThemeChange('accentColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={formData.theme?.accentColor || '#F27D26'}
                  onChange={e => handleThemeChange('accentColor', e.target.value)}
                  className={`${FIELD} uppercase flex-1`}
                />
              </div>
              <p className="text-xs text-text-muted">访客可在右上角自选颜色，自选优先于此处</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">自定义鼠标指针</label>
              <ImageUploadField
                label="指针文件"
                value={formData.theme?.cursorUrl || ''}
                onChange={url => handleThemeChange('cursorUrl', url)}
                accept="image/x-icon,image/png,image/svg+xml,image/gif"
                preview="square"
                hint=".cur / .png / .svg，留空使用默认"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <ImageUploadField
                label="全局背景"
                value={formData.theme?.globalBackground || ''}
                onChange={url => handleThemeChange('globalBackground', url)}
                preview="wide"
                hint="整站固定背景图，会叠加半透明遮罩保证可读性；留空时启用随机壁纸"
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-3">
              <input
                type="checkbox"
                id="wallpaperEnabled"
                checked={formData.theme?.wallpaperEnabled !== false}
                onChange={e => handleThemeChange('wallpaperEnabled', e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
              <label htmlFor="wallpaperEnabled" className="text-sm font-medium text-text-primary cursor-pointer">
                随机壁纸背景（未配置全局背景时启用，自动适配明暗保证文字可读）
              </label>
            </div>
          </div>
        </section>

        {/* 樱花 / 吉祥物 / 桌宠 */}
        <section className={SECTION}>
          <h3 className="mb-4 text-lg font-bold text-text-primary">樱花飘落</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">开关</label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="checkbox"
                  id="sakuraEnabled"
                  checked={formData.theme?.sakuraEnabled !== false}
                  onChange={e => handleThemeChange('sakuraEnabled', e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
                <label htmlFor="sakuraEnabled" className="text-sm font-medium text-text-primary cursor-pointer">
                  启用樱花飘落特效
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">花瓣密度</label>
              <input
                type="number"
                min="10"
                max="200"
                value={formData.theme?.sakuraDensity || 50}
                onChange={e => handleThemeChange('sakuraDensity', parseInt(e.target.value))}
                className={FIELD}
              />
              <p className="text-xs text-text-muted">花瓣数量（10–200）</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">飘落速度</label>
              <select
                value={formData.theme?.sakuraSpeed || 'normal'}
                onChange={e => handleThemeChange('sakuraSpeed', e.target.value)}
                className={FIELD}
              >
                <option value="slow">慢</option>
                <option value="normal">正常</option>
                <option value="fast">快</option>
              </select>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h3 className="mb-4 text-lg font-bold text-text-primary">静态吉祥物</h3>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="mascotEnabled"
                checked={formData.theme?.mascotEnabled !== false}
                onChange={e => handleThemeChange('mascotEnabled', e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
              <label htmlFor="mascotEnabled" className="text-sm font-medium text-text-primary cursor-pointer">
                启用静态吉祥物（头像、昵称与气泡台词）
              </label>
            </div>
            <p className="mt-2 ml-7 text-xs text-text-muted">桌宠关闭时才显示；桌宠开启时由下方设置接管。</p>
          </div>
        </section>

        <section className="bg-bg-card border border-orange-300/40 rounded-2xl p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-text-primary">胡桃桌宠（Live2D）</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="petEnabled"
                checked={formData.theme?.pet?.enabled !== false}
                onChange={e => handlePetChange({ enabled: e.target.checked })}
                className="w-4 h-4 accent-[var(--accent)]"
              />
              <label htmlFor="petEnabled" className="text-sm font-medium text-text-primary cursor-pointer">
                启用 Live2D 桌宠（替代静态吉祥物）
              </label>
            </div>
            <p className="text-xs text-text-muted ml-7 -mt-2">
              支持拖动、位置记忆、遮挡自动避让，单击听台词、双击打开对话。
            </p>

            <div className="flex items-center gap-3">
              <label htmlFor="petModel" className="w-28 text-sm font-medium text-text-primary">模型</label>
              <select
                id="petModel"
                value={formData.theme?.pet?.model || 'hutao'}
                onChange={e => handlePetChange({ model: e.target.value })}
                className="px-3 py-1.5 bg-bg-base border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="hutao">胡桃（本地模型）</option>
                <option value="haru">春 Haru（实验性）</option>
                <option value="fallback">静态头像模式</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="petVoice"
                checked={formData.theme?.pet?.voiceEnabled === true}
                onChange={e => handlePetChange({ voiceEnabled: e.target.checked })}
                className="w-4 h-4 accent-[var(--accent)]"
              />
              <label htmlFor="petVoice" className="text-sm font-medium text-text-primary cursor-pointer">
                台词语音（音频包优先，浏览器 TTS 兜底）
              </label>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="petSize" className="w-28 text-sm font-medium text-text-primary">桌宠大小</label>
              <input
                type="range" id="petSize" min="0.5" max="1.5" step="0.05"
                value={formData.theme?.pet?.size || 1}
                onChange={e => handlePetChange({ size: parseFloat(e.target.value) })}
                className="flex-1 accent-[var(--accent)]"
              />
              <span className="w-14 text-right text-sm text-text-secondary">
                {Math.round((formData.theme?.pet?.size || 1) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="petOpacity" className="w-28 text-sm font-medium text-text-primary">不透明度</label>
              <input
                type="range" id="petOpacity" min="0.3" max="1" step="0.05"
                value={formData.theme?.pet?.opacity || 1}
                onChange={e => handlePetChange({ opacity: parseFloat(e.target.value) })}
                className="flex-1 accent-[var(--accent)]"
              />
              <span className="w-14 text-right text-sm text-text-secondary">
                {Math.round((formData.theme?.pet?.opacity || 1) * 100)}%
              </span>
            </div>
            <p className="text-xs text-text-muted">保存后刷新前台页面生效；桌宠位置由前台拖动决定（自动记忆）。</p>
          </div>
        </section>

        {/* 音乐卡片 */}
        <section className={SECTION}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">音乐卡片</h2>
              <p className="mt-1 text-sm text-text-secondary">
                侧栏音乐卡默认遥控本机的网易云官方播放器；没有播放时回落到本地歌单。歌单在这里维护：
              </p>
            </div>
            <Link
              to="/admin/media"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg-base px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
            >
              去编辑歌单 <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* 社交链接 */}
        <section className={SECTION}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">社交链接</h2>
            <button type="button" onClick={addSocial} className={ADD_BTN}>+ 添加链接</button>
          </div>
          <div className="flex flex-col gap-4">
            {(formData.social || []).map((social: any, index: number) => (
              <div key={index} className="flex items-center gap-4 bg-bg-base p-4 rounded-xl border border-border">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>平台（github / mail / qq）</label>
                    <input
                      type="text"
                      value={social.platform}
                      onChange={e => handleSocialChange(index, 'platform', e.target.value)}
                      className={ROW_FIELD}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>链接地址</label>
                    <input
                      type="text"
                      value={social.url}
                      onChange={e => handleSocialChange(index, 'url', e.target.value)}
                      className={ROW_FIELD}
                    />
                  </div>
                </div>
                <button type="button" onClick={() => removeSocial(index)} className={ROW_REMOVE}>移除</button>
              </div>
            ))}
            {(!formData.social || formData.social.length === 0) && (
              <p className={EMPTY}>还没有社交链接，点击「添加链接」开始。</p>
            )}
          </div>
        </section>

        {/* 友情链接 */}
        <section className={SECTION}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">友情链接</h2>
            <button
              type="button"
              onClick={() => {
                setFormData((prev: any) => ({
                  ...prev,
                  friends: [...(prev.friends || []), { name: '', url: '', avatar: '', desc: '' }]
                }));
              }}
              className={ADD_BTN}
            >
              + 添加友链
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {(formData.friends || []).map((friend: any, index: number) => (
              <div key={index} className="flex items-start gap-4 bg-bg-base p-4 rounded-xl border border-border">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>站点名称</label>
                    <input
                      type="text"
                      value={friend.name || ''}
                      onChange={e => updateFriend(index, 'name', e.target.value)}
                      placeholder="朋友的博客"
                      className={ROW_FIELD}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>站点地址</label>
                    <input
                      type="text"
                      value={friend.url || ''}
                      onChange={e => updateFriend(index, 'url', e.target.value)}
                      placeholder="https://friend.example.com"
                      className={ROW_FIELD}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>头像图片地址（可选）</label>
                    <input
                      type="text"
                      value={friend.avatar || ''}
                      onChange={e => updateFriend(index, 'avatar', e.target.value)}
                      placeholder="/uploads/xxx.png 或站内图片路径"
                      className={ROW_FIELD}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>一句话描述</label>
                    <input
                      type="text"
                      value={friend.desc || ''}
                      onChange={e => updateFriend(index, 'desc', e.target.value)}
                      placeholder="前端 / 摄影 / 读书笔记…"
                      className={ROW_FIELD}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev: any) => {
                      const newFriends = [...(prev.friends || [])];
                      newFriends.splice(index, 1);
                      return { ...prev, friends: newFriends };
                    });
                  }}
                  className={ROW_REMOVE}
                >
                  移除
                </button>
              </div>
            ))}
            {(!formData.friends || formData.friends.length === 0) && (
              <p className={EMPTY}>还没有友链，点击「添加友链」开始。</p>
            )}
          </div>
        </section>

        {/* 关于页 */}
        <section className={SECTION}>
          <h2 className="mb-6 text-xl font-bold text-text-primary">关于页</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">关于内容（Markdown）</label>
              <textarea
                value={formData.about?.content || ''}
                onChange={e => handleAboutChange('content', e.target.value)}
                rows={10}
                placeholder={'# 关于我\n\n你好！我是…\n\n::: tip 提示块\n也支持这样的提示卡\n:::'}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors resize-y font-mono text-sm"
              />
              <p className="text-xs text-text-muted">支持 Markdown 与提示块语法；留空时显示默认的站点介绍</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">技能标签</label>
                <button type="button" onClick={addAboutSkill} className={ADD_BTN}>+ 添加技能</button>
              </div>
              <div className="flex flex-col gap-2">
                {(formData.about?.skills || []).map((skill: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={e => handleAboutSkillsChange(index, e.target.value)}
                      placeholder="例如：React / Vue / TypeScript"
                      className="flex-1 px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                    <button type="button" onClick={() => removeAboutSkill(index)} className={ROW_REMOVE}>移除</button>
                  </div>
                ))}
                {(!formData.about?.skills || formData.about.skills.length === 0) && (
                  <p className="text-sm text-text-secondary text-center py-2">还没有技能标签，留空时使用默认列表。</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 页脚 */}
        <section className={SECTION}>
          <h2 className="mb-6 text-xl font-bold text-text-primary">页脚</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">版权文字</label>
              <input
                type="text"
                value={formData.footer?.copyright || ''}
                onChange={e => handleFooterChange('copyright', e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">备案号</label>
              <input
                type="text"
                value={formData.footer?.icp || ''}
                onChange={e => handleFooterChange('icp', e.target.value)}
                placeholder="豫ICP备xxxxxxxx号-x"
                className={FIELD}
              />
            </div>
          </div>
        </section>

        {/* 导航菜单 */}
        <section className={SECTION}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">导航菜单</h2>
            <button
              type="button"
              onClick={() => {
                setFormData((prev: any) => ({
                  ...prev,
                  nav: [...(prev.nav || []), { name: '', path: '/', icon: 'FileText', external: false, href: '' }]
                }));
              }}
              className={ADD_BTN}
            >
              + 添加菜单项
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {(formData.nav || []).map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-4 bg-bg-base p-4 rounded-xl border border-border">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>名称</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateNav(index, { name: e.target.value })}
                      placeholder="教程中心"
                      className={ROW_FIELD}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>站内路径</label>
                    <input
                      type="text"
                      value={item.path}
                      onChange={e => updateNav(index, { path: e.target.value })}
                      placeholder="/tutorials"
                      className={ROW_FIELD}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>图标</label>
                    <select
                      value={item.icon}
                      onChange={e => updateNav(index, { icon: e.target.value })}
                      className={ROW_FIELD}
                    >
                      {!NAV_ICONS.some(([v]) => v === item.icon) && <option value={item.icon}>{item.icon}</option>}
                      {NAV_ICONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}（{value}）</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={ROW_LABEL}>外部链接（可选）</label>
                    <input
                      type="text"
                      value={item.href || ''}
                      onChange={e => updateNav(index, { external: !!e.target.value, href: e.target.value })}
                      placeholder="https://example.com"
                      className={ROW_FIELD}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev: any) => {
                      const newNav = [...(prev.nav || [])];
                      newNav.splice(index, 1);
                      return { ...prev, nav: newNav };
                    });
                  }}
                  className={ROW_REMOVE}
                >
                  移除
                </button>
              </div>
            ))}
            {(!formData.nav || formData.nav.length === 0) && (
              <p className={EMPTY}>还没有导航项。</p>
            )}
          </div>
        </section>

      </form>
    </div>
  );
};
