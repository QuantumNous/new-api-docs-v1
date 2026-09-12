'use client';

import { useEffect, useState } from 'react';

interface QuizProps {
  locale?: 'en' | 'zh' | 'ja';
}

const translations = {
  zh: {
    questions: [
      {
        id: 'q1',
        question: '1. New API 是什么？',
        options: [
          {
            value: 'a',
            label: '一个商业 API 销售平台',
          },
          {
            value: 'b',
            label: '一个开源的 AI 接口管理和分发系统',
          },
          {
            value: 'c',
            label: '一个付费聊天软件',
          },
          {
            value: 'd',
            label: '一个公共 API 服务站点',
          },
        ],
        correct: 'b',
        errorMessage:
          'New API 是开源的 AI 接口管理和分发系统，请阅读项目介绍。',
      },
      {
        id: 'q2',
        question: '2. Discord 社区是否允许发布账号交易、购买引导或求购信息？',
        options: [
          {
            value: 'true',
            label: '允许',
          },
          {
            value: 'false',
            label: '不允许',
          },
        ],
        correct: 'false',
        errorMessage:
          '根据社区规则第 2 条：讨论应聚焦项目使用、部署、开发和反馈，不发布交易或购买相关信息。',
      },
      {
        id: 'q3',
        question: '3. 使用 New API 时，可以忽略其开源协议吗？',
        options: [
          {
            value: 'true',
            label: '可以',
          },
          {
            value: 'false',
            label: '不可以，应遵守 GNU AGPLv3 开源协议',
          },
        ],
        correct: 'false',
        errorMessage:
          '根据社区规则第 4 条：使用 New API 应遵守 GNU AGPLv3 开源协议。',
      },
      {
        id: 'q4',
        question: '4. Discord 社区管理员是否有义务提供技术支持？',
        options: [
          {
            value: 'true',
            label: '有义务提供技术支持',
          },
          {
            value: 'false',
            label: '没有义务；Bug 和功能建议应通过 GitHub issue 反馈',
          },
        ],
        correct: 'false',
        errorMessage:
          '根据社区规则第 1 条：管理员没有提供技术支持的义务，问题反馈请按文档提交 issue。',
      },
      {
        id: 'q5',
        question: '5. 可以仅凭 Discord 私信中自称“官方”的身份相信项目信息吗？',
        options: [
          {
            value: 'true',
            label: '可以，只要对方自称官方',
          },
          {
            value: 'false',
            label: '不可以，应通过官方仓库、文档和社区渠道核实',
          },
        ],
        correct: 'false',
        errorMessage:
          '根据社区规则第 3 条：请通过官方仓库、文档和社区渠道获取及核实项目信息。',
      },
    ],
    submitButton: '提交答案',
    answerAllQuestions: '请回答所有问题后再提交。',
    successTitle: '验证通过，欢迎加入 Discord！',
    successMessage:
      '感谢您阅读社区规则。点击下方邀请链接，加入 New API Discord 社区。',
    joinLink: '接受邀请，加入 Discord',
    incorrectAnswer: '请检查答案',
  },
  en: {
    questions: [
      {
        id: 'q1',
        question: '1. What is New API?',
        options: [
          {
            value: 'a',
            label: 'A commercial API sales platform',
          },
          {
            value: 'b',
            label:
              'An open-source AI interface management and distribution system',
          },
          {
            value: 'c',
            label: 'A paid chat application',
          },
          {
            value: 'd',
            label: 'A public API service',
          },
        ],
        correct: 'b',
        errorMessage:
          'New API is an open-source AI interface management and distribution system. Please read the project introduction.',
      },
      {
        id: 'q2',
        question:
          '2. May I post account trading, purchase guidance, or purchase requests in the Discord community?',
        options: [
          {
            value: 'true',
            label: 'Yes',
          },
          {
            value: 'false',
            label: 'No',
          },
        ],
        correct: 'false',
        errorMessage:
          'Community Rule 2 focuses discussions on project usage, deployment, development, and feedback, without trading or purchase-related posts.',
      },
      {
        id: 'q3',
        question: '3. May I ignore the open-source license when using New API?',
        options: [
          {
            value: 'true',
            label: 'Yes',
          },
          {
            value: 'false',
            label: 'No, I must comply with the GNU AGPLv3 license',
          },
        ],
        correct: 'false',
        errorMessage:
          'Community Rule 4 requires compliance with the GNU AGPLv3 open-source license.',
      },
      {
        id: 'q4',
        question:
          '4. Are Discord community administrators obligated to provide technical support?',
        options: [
          {
            value: 'true',
            label: 'Yes',
          },
          {
            value: 'false',
            label: 'No; report bugs and feature requests through GitHub issues',
          },
        ],
        correct: 'false',
        errorMessage:
          'Community Rule 1 states that administrators are not obligated to provide technical support. Follow the feedback guide to submit an issue.',
      },
      {
        id: 'q5',
        question:
          '5. Should I trust project information solely because a Discord direct message claims to be official?',
        options: [
          {
            value: 'true',
            label: 'Yes, an official claim is enough',
          },
          {
            value: 'false',
            label:
              'No, verify it through official repositories, documentation, and community channels',
          },
        ],
        correct: 'false',
        errorMessage:
          'Community Rule 3 directs you to official repositories, documentation, and community channels to obtain and verify project information.',
      },
    ],
    submitButton: 'Submit Answers',
    answerAllQuestions: 'Please answer all questions before submitting.',
    successTitle: 'Verification passed — welcome to Discord!',
    successMessage:
      'Thank you for reading the community rules. Use the invitation below to join the New API Discord community.',
    joinLink: 'Accept invitation and join Discord',
    incorrectAnswer: 'Please check your answers',
  },
  ja: {
    questions: [
      {
        id: 'q1',
        question: '1. New API とは何ですか？',
        options: [
          {
            value: 'a',
            label: '商用 API 販売プラットフォーム',
          },
          {
            value: 'b',
            label: 'オープンソースの AI インターフェース管理・配布システム',
          },
          {
            value: 'c',
            label: '有料チャットアプリ',
          },
          {
            value: 'd',
            label: '公開 API サービス',
          },
        ],
        correct: 'b',
        errorMessage:
          'New API はオープンソースの AI インターフェース管理・配布システムです。プロジェクト紹介をご確認ください。',
      },
      {
        id: 'q2',
        question:
          '2. Discord コミュニティでアカウント取引、購入案内、購入希望を投稿できますか？',
        options: [
          {
            value: 'true',
            label: 'はい',
          },
          {
            value: 'false',
            label: 'いいえ',
          },
        ],
        correct: 'false',
        errorMessage:
          'コミュニティルール第 2 条：プロジェクトの利用、デプロイ、開発、フィードバックを中心に議論し、取引や購入に関する情報は投稿しないでください。',
      },
      {
        id: 'q3',
        question:
          '3. New API の利用時にオープンソースライセンスを無視できますか？',
        options: [
          {
            value: 'true',
            label: 'はい',
          },
          {
            value: 'false',
            label: 'いいえ、GNU AGPLv3 ライセンスを遵守する必要があります',
          },
        ],
        correct: 'false',
        errorMessage:
          'コミュニティルール第 4 条：GNU AGPLv3 オープンソースライセンスを遵守してください。',
      },
      {
        id: 'q4',
        question:
          '4. Discord コミュニティの管理者には技術サポートを提供する義務がありますか？',
        options: [
          {
            value: 'true',
            label: 'はい',
          },
          {
            value: 'false',
            label: 'いいえ。バグや機能の提案は GitHub issue で報告します',
          },
        ],
        correct: 'false',
        errorMessage:
          'コミュニティルール第 1 条：管理者には技術サポートを提供する義務はありません。報告ガイドに従って issue を提出してください。',
      },
      {
        id: 'q5',
        question:
          '5. Discord の DM で「公式」と名乗っているだけで、プロジェクト情報を信用してよいですか？',
        options: [
          {
            value: 'true',
            label: 'はい、公式と名乗っていれば十分です',
          },
          {
            value: 'false',
            label:
              'いいえ、公式リポジトリ、ドキュメント、コミュニティで確認します',
          },
        ],
        correct: 'false',
        errorMessage:
          'コミュニティルール第 3 条：公式リポジトリ、ドキュメント、コミュニティチャネルで情報を取得・確認してください。',
      },
    ],
    submitButton: '回答を送信',
    answerAllQuestions: 'すべての質問に回答してから送信してください。',
    successTitle: '確認が完了しました。Discord へようこそ！',
    successMessage:
      'コミュニティルールをご確認いただきありがとうございます。下の招待リンクから New API Discord コミュニティにご参加ください。',
    joinLink: '招待を受けて Discord に参加',
    incorrectAnswer: '回答をご確認ください',
  },
};

const FAILED_ATTEMPT_KEY = 'newapi-community-quiz-failed';

const attemptMessages = {
  zh: {
    warning:
      '每个浏览器仅有一次答题机会。确认提交后，只要有一道题答错，就不能再次答题。请仔细检查答案。',
    confirm: '确定提交答案吗？答错将无法重答。',
    locked: '答题机会已用完',
    lockedDescription:
      '你已提交过错误答案，此浏览器无法再次答题。刷新页面或切换语言不会重置答题机会。',
    loading: '正在检查答题状态…',
    unavailable:
      '无法保存本地答题记录，暂时不能提交。请允许此站点使用浏览器本地存储后刷新页面。',
  },
  en: {
    warning:
      'You have one attempt per browser. After you confirm submission, any incorrect answer prevents further attempts. Please check your answers carefully.',
    confirm: 'Submit your answers? Incorrect answers prevent another attempt.',
    locked: 'Your attempt has been used',
    lockedDescription:
      'You previously submitted an incorrect answer. This browser cannot try again, even after refreshing or changing the language.',
    loading: 'Checking your attempt status…',
    unavailable:
      'Your attempt cannot be saved locally. Enable local storage for this site and reload before submitting.',
  },
  ja: {
    warning:
      '回答の機会はブラウザーごとに一度です。送信を確認した後、一問でも間違えると再回答できません。回答をよく確認してください。',
    confirm: '回答を送信しますか？間違えると再回答できません。',
    locked: '回答の機会は使用済みです',
    lockedDescription:
      '以前の回答に誤りがあったため、このブラウザーでは再回答できません。再読み込みや言語の変更でもリセットされません。',
    loading: '回答状況を確認しています…',
    unavailable:
      '回答記録を保存できません。このサイトのローカルストレージを許可して、ページを再読み込みしてください。',
  },
};

export function CommunityQuiz({ locale = 'en' }: QuizProps) {
  const t = translations[locale] || translations.en;
  const messages = attemptMessages[locale] || attemptMessages.en;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'locked' | 'unavailable'
  >('loading');

  useEffect(() => {
    try {
      if (localStorage.getItem(FAILED_ATTEMPT_KEY) === 'true') {
        setStatus('locked');
      } else {
        // Refuse attempts when the browser cannot persist the failure record.
        const probeKey = `${FAILED_ATTEMPT_KEY}-storage-check`;
        localStorage.setItem(probeKey, '1');
        localStorage.removeItem(probeKey);
        setStatus('ready');
      }
    } catch {
      setStatus('unavailable');
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === FAILED_ATTEMPT_KEY && event.newValue === 'true') {
        setStatus('locked');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAnswerChange = (questionId: string, value: string) => {
    if (status !== 'ready') return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
  };

  const handleSubmit = () => {
    if (status !== 'ready') return;
    if (t.questions.some((q) => !answers[q.id])) {
      setError(t.answerAllQuestions);
      return;
    }
    if (!window.confirm(messages.confirm)) return;

    try {
      // Recheck after confirmation in case another tab has used the attempt.
      if (localStorage.getItem(FAILED_ATTEMPT_KEY) === 'true') {
        setStatus('locked');
        return;
      }
      if (t.questions.some((q) => answers[q.id] !== q.correct)) {
        localStorage.setItem(FAILED_ATTEMPT_KEY, 'true');
        setStatus('locked');
        return;
      }
      setShowResult(true);
    } catch {
      setStatus('unavailable');
    }
  };

  if (status !== 'ready') {
    return (
      <div role="status" className="bg-fd-card my-5 rounded-xl border p-5">
        {status === 'locked' ? (
          <>
            <h3 className="mt-0 font-semibold">{messages.locked}</h3>
            <p className="text-fd-muted-foreground mb-0">
              {messages.lockedDescription}
            </p>
          </>
        ) : (
          <p className="text-fd-muted-foreground m-0">
            {status === 'loading' ? messages.loading : messages.unavailable}
          </p>
        )}
      </div>
    );
  }

  if (showResult) {
    return (
      <>
        <div className="bg-fd-card text-fd-card-foreground my-4 flex flex-row gap-2 rounded-xl border p-3 ps-1 text-sm shadow-md">
          <div
            role="none"
            className="bg-fd-primary w-0.5 shrink-0 rounded-sm"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="fill-fd-primary text-fd-card size-5 shrink-0"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="font-medium">{t.successTitle}</span>
            <span className="text-fd-muted-foreground">{t.successMessage}</span>
          </div>
        </div>

        <a
          href="https://discord.gg/9US8FvUCJE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded bg-blue-600 px-5 py-2.5 font-medium text-white no-underline transition-colors hover:bg-blue-700"
        >
          {t.joinLink}
        </a>
      </>
    );
  }

  return (
    <div data-community-quiz style={{ margin: '20px 0' }}>
      <p className="bg-fd-muted mb-5 rounded-xl border p-4 text-sm">
        {messages.warning}
      </p>
      {t.questions.map((question) => (
        <div
          key={question.id}
          style={{
            marginBottom: '20px',
            padding: '15px',
            background: 'var(--fd-secondary)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '10px' }}>
            {question.question}
          </div>
          {question.options.map((option) => (
            <label
              key={option.value}
              style={{
                display: 'block',
                margin: '8px 0',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={answers[question.id] === option.value}
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                style={{ marginRight: '8px' }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ))}

      {error && (
        <div className="bg-fd-card text-fd-card-foreground my-4 flex flex-row gap-2 rounded-xl border p-3 ps-1 text-sm shadow-md">
          <div
            role="none"
            className="w-0.5 shrink-0 rounded-sm"
            style={{ backgroundColor: '#ef4444' }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="#ef4444"
            className="size-5 shrink-0"
          >
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
          </svg>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="font-medium">{t.incorrectAnswer}</span>
            <span className="text-fd-muted-foreground">{error}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        {t.submitButton}
      </button>
    </div>
  );
}
