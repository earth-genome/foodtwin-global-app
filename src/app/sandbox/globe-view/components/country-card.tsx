import { CountryLimitProperties } from "@/types/countries";

export function CountryCard({
  name,
  sovereignt,
  admin,
  continent,
  region_un,
  subregion,
  pop_est,
  gdp_md_est,
  economy,
  income_grp,
}: CountryLimitProperties) {
  return (
    <div key={name} className="p-4 bg-white shadow-md rounded-lg">
      <h2>{name}</h2>
      <table>
        <tbody>
          <tr>
            <td>Sovereignty:</td>
            <td>{sovereignt}</td>
          </tr>
          <tr>
            <td>Admin:</td>
            <td>{admin}</td>
          </tr>
          <tr>
            <td>Continent:</td>
            <td>{continent}</td>
          </tr>
          <tr>
            <td>UN Region:</td>
            <td>{region_un}</td>
          </tr>
          <tr>
            <td>Subregion:</td>
            <td>{subregion}</td>
          </tr>
          <tr>
            <td>Population Estimate:</td>
            <td>{pop_est}</td>
          </tr>
          <tr>
            <td>GDP Estimate (in million USD):</td>
            <td>{gdp_md_est}</td>
          </tr>
          <tr>
            <td>Economy:</td>
            <td>{economy}</td>
          </tr>
          <tr>
            <td>Income Group:</td>
            <td>{income_grp}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
