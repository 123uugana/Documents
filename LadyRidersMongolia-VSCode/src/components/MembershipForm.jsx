import { useState } from "react";
import SectionHeading from "./SectionHeading.jsx";
import UserLogin from "./UserLogin.jsx";
import UserRegister from "./UserRegister.jsx";
import UserStatus from "./UserStatus.jsx";

export default function MembershipForm({
  user,
  onRegister,
  onLogin,
  onLogout,
  onSubmitApplication
}) {
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      await onSubmitApplication(formData);
      form.reset();
      setMessage("Анкет амжилттай илгээгдлээ.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section id="membership" className="section section-alt membership-section" aria-labelledby="membershipTitle">
      <div className="membership-shell">
        <div className="form-header">
          <img src="/source.jpg" alt="Lady Riders Mongolia membership form logo" className="form-logo" />
          <p className="eyebrow">Membership</p>
          <h2 id="membershipTitle">Lady Riders membership</h2>
          <p className="form-subtitle">Account үүсгээд анкет бөглөнө.</p>
        </div>

        {!user ? (
          <>
            <SectionHeading eyebrow="Account" title="Нэвтрэх эсвэл бүртгүүлэх" titleId="memberAccountTitle" />
            <div className="account-grid">
              <UserRegister onRegister={onRegister} />
              <UserLogin onLogin={onLogin} />
            </div>
          </>
        ) : (
          <>
            <UserStatus user={user} onLogout={onLogout} />

            <form className="membership-form" autoComplete="on" onSubmit={handleSubmit}>
              <div className="form-section-card">
                <h3>Membership application</h3>

                <div className="form-row">
                  <label className="form-group">
                    <span>Овог</span>
                    <input type="text" name="lastName" required />
                  </label>
                  <label className="form-group">
                    <span>Нэр</span>
                    <input type="text" name="firstName" defaultValue={user.name} required />
                  </label>
                </div>

                <div className="form-row">
                  <label className="form-group">
                    <span>Email</span>
                    <input type="email" name="email" defaultValue={user.email} required />
                  </label>
                  <label className="form-group">
                    <span>Утас</span>
                    <input type="tel" name="mobilePhone" placeholder="99000000" required />
                  </label>
                </div>

                <div className="form-row">
                  <label className="form-group">
                    <span>Мотоцикл</span>
                    <input type="text" name="motorcycleBrand" placeholder="Honda CB500X" />
                  </label>
                  <label className="form-group">
                    <span>Улсын дугаар</span>
                    <input type="text" name="licensePlate" />
                  </label>
                </div>

                <label className="form-group">
                  <span>Яагаад клубт элсэхийг хүсэж байна вэ?</span>
                  <textarea name="whyJoin" rows="3" />
                </label>

                <div className="form-row">
                  <label className="form-group file-field">
                    <span>Профайл зураг</span>
                    <input type="file" name="profilePhoto" accept="image/*" />
                    <small>JPG, PNG, WEBP зураг сонгоно уу.</small>
                  </label>
                  <label className="form-group file-field">
                    <span>Мотоциклийн зураг</span>
                    <input type="file" name="motorcyclePhoto" accept="image/*" />
                    <small>JPG, PNG, WEBP зураг сонгоно уу.</small>
                  </label>
                </div>

                <fieldset className="choice-group consent-group">
                  <legend>Баталгаажуулалт</legend>
                  <label>
                    <input type="checkbox" name="privacyAgreed" required />{" "}
                    <span>Би хувийн мэдээллээ membership шалгалтад ашиглуулахыг зөвшөөрч байна.</span>
                  </label>
                </fieldset>
              </div>

              <div className="form-actions">
                <button type="submit">Анкет илгээх</button>
                <button type="reset" className="secondary-button">Дахин эхлүүлэх</button>
              </div>

              <p className="membership-message" role="status">{message}</p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
